import Api from "../Api";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import IndexedDB from "@Background/Db/IndexedDB";
import type {
    TAppDetail,
    TDynamicStoreStatusResponse,
    TPackageDetail,
    TWishlistGame
} from "./_types";
import LocalStorage from "@Core/Storage/LocalStorage";
import {EAction} from "@Background/EAction";
import Errors from "@Core/Errors/Errors";
import HTMLParser from "@Core/Html/HtmlParser";
import TimeUtils from "@Core/Utils/TimeUtils";
import {Unrecognized} from "@Background/background";
import type DomParserInterface from "@Background/Modules/Dom/DomParserInterface";
import DomParserFactory from "@Background/Modules/Dom/DomParserFactory";

// helper types for clarity
type TAppid = number;
type TSubid = number;

export default class SteamStoreApi extends Api implements MessageHandlerInterface {

    constructor() {
        super("https://store.steampowered.com/");
    }

    private async fetchPage(
        url: string|URL
    ): Promise<string> {
        let response = await fetch(url, {credentials: "include"});

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        if (new URL(response.url).pathname === "/login/") {
            throw new Errors.LoginError("store");
        }

        return await response.text();
    }

    private async fetchPackageApps(subid: TSubid): Promise<TAppid[]> {
        const url = this.getUrl("/api/packagedetails/", {"packageids": subid});
        const data = await this.fetchJson<{
            [strSubid: string]: {
                success: boolean,
                data: TPackageDetail
            }
        }>(url)

        const details = data[String(subid)];
        return details && details.success
            ? details.data.apps.map(obj => obj.id)
            : []
    }

    public async getPackageApps(subids: number[]): Promise<Map<TSubid, TAppid[]>> {

        let result = new Map<TSubid, TAppid[]>;

        let toFetch: number[] = [];
        const data = await IndexedDB.getObject("packages", subids);
        for (let [subid, entry] of Object.entries(data)) {
            if (!entry || TimeUtils.isInPast(entry.expiry)) {
                toFetch.push(Number(subid));
            } else {
                result.set(Number(subid), entry.appids);
            }
        }

        if (toFetch.length > 0) {
            let newData: Array<[TSubid, {appids: number[], expiry: number}]> = [];
            for (let subid of toFetch) {
                const appids = await this.fetchPackageApps(subid);
                newData.push([
                    subid,
                    {appids, expiry: TimeUtils.now() + 86400}
                ]);
                result.set(subid, appids);
            }

            if (newData.length > 0) {
                await IndexedDB.putMany("packages", newData);
            }
        }

        return result;
    }

    private async wishlistAdd(appid: number): Promise<void> {
        let result: Record<string, any>|undefined;
        const sessionid = await this.fetchSessionId();

        if (sessionid) {
            const url = this.getUrl("/api/addtowishlist");
            result = await this.fetchJson(url, {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams({
                    sessionid,
                    appid: String(appid)
                })
            });
        }

        if (!result || !result.success) {
            throw new Error(`Failed to add app ${appid} to wishlist`);
        }

        await this.clearDynamicStore();
    }

    private async wishlistRemove(appid: number): Promise<void> {
        let result: Record<string, any>|undefined;
        const sessionid = await this.fetchSessionId();

        if (sessionid) {
            const url = this.getUrl("/api/removefromwishlist")
            result = await this.fetchJson(url, {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams({
                    sessionid,
                    appid: String(appid)
                })
            });
        }

        if (!result || !result.success) {
            throw new Error(`Failed to remove app ${appid} from wishlist`);
        }

        await this.clearDynamicStore();
    }

    private async getCurrencyFromWallet(parser: DomParserInterface): Promise<string|null> {
        const url = this.getUrl("/steamaccount/addfunds");
        const html = await this.fetchPage(url);
        return parser.parseCurrencyFromWallet(html);
    }

    private async getCurrencyFromApp(parser: DomParserInterface): Promise<string|null> {
        const url = this.getUrl("/app/220");
        const html = await this.fetchPage(url);
        return parser.parseCurrencyFromApp(html);
    }

    private async getCurrency(): Promise<string> {
        let stored = await LocalStorage.get("currency");
        if (stored && TimeUtils.isInFuture(stored.expiry)) {
            return stored.data;
        }

        const parser = DomParserFactory.getParser();

        let currency = await this.getCurrencyFromWallet(parser);
        if (!currency) {
            currency = await this.getCurrencyFromApp(parser);
            if (!currency) {
                throw new Error("Store currency could not be determined from app 220");
            }
        }

        await LocalStorage.set("currency", {
            data: currency,
            expiry: TimeUtils.now() + 86400
        });
        return currency;
    }

    private async fetchSessionId(): Promise<string|null> {
        const url = this.getUrl("/about/");
        const html = await this.fetchPage(url);
        return HTMLParser.getStringVariable("g_sessionID", html);
    }

    private async fetchPurchaseDates(lang: string): Promise<Array<[string, string]>> {
        const url = this.getUrl("/account/licenses/", {"l": lang});
        const html = await this.fetchPage(url);
        const parser = DomParserFactory.getParser();

        return parser.parsePurchaseDates(html);
    }

    private async getPurchaseDate(appName: string, lang: string): Promise<string|null> {
        if (await IndexedDB.isStoreExpired("purchases")) {
            const purchaseDates = await this.fetchPurchaseDates(lang);
            await IndexedDB.putMany("purchases", purchaseDates);
            await IndexedDB.setStoreExpiry("purchases", 86400);
        }

        return await IndexedDB.get("purchases", appName) ?? null;
    }

    private clearPurchases(): Promise<void> {
        return IndexedDB.clear("purchases");
    }

    private async refreshDynamicStore(): Promise<void> {
        const isExpired = await IndexedDB.isStoreExpired("dynamicStore");
        if (!isExpired) {
            return;
        }

        const url = this.getUrl("dynamicstore/userdata");
        const store = await this.fetchJson<{
            // note: incomplete
            rgOwnedApps: number[],
            rgOwnedPackages: number[],
            rgIgnoredApps: Record<number, number>,
            rgWishlist: number[]
        }>(url, {cache: "no-cache"});

        const {rgOwnedApps, rgOwnedPackages, rgIgnoredApps, rgWishlist} = store;

        let ignored: number[] = [];
        let ignoredOwnedElsewhere: number[] = [];

        for (let [appid_, value] of Object.entries(rgIgnoredApps)) {
            const appid = Number(appid_);
            if (value === 0) {
                ignored.push(appid);
            } else if (value === 2) {
                ignoredOwnedElsewhere.push(appid);
            }
        }

        await IndexedDB.putMany("dynamicStore", [
            ["ignored", ignored],
            ["ignoredOwnedElsewhere", ignoredOwnedElsewhere],
            ["ownedApps", rgOwnedApps],
            ["ownedPackages", rgOwnedPackages],
            ["wishlisted", rgWishlist],
        ]);
        await IndexedDB.setStoreExpiry("dynamicStore", 5*60);
    }

    private async getDynamicStoreStatus(ids: string[]): Promise<TDynamicStoreStatusResponse> {
        await this.refreshDynamicStore();

        const db = IndexedDB.db;
        const tx = db.transaction("dynamicStore");
        const index = tx.store.index("idx_appid");

        let ignored: string[] = [];
        let ignoredOwned: string[] = [];
        let owned: string[] = [];
        let wishlisted: string[] = [];

        for (const strId of ids) {
            const parts = strId.split("/", 2);
            if (parts.length != 2) {
                continue;
            }

            const type = parts[0];
            const id = Number(parts[1]);

            const keys = await index.getAllKeys(id);
            for (let key of keys) {
                switch(key) {
                    case "ignored": ignored.push(strId); break;
                    case "ignoredOwnedElsewhere": ignoredOwned.push(strId); break;
                    case "wishlisted": wishlisted.push(strId); break;
                    case "ownedApps":
                        if (type === "app") {
                            owned.push(strId);
                        }
                        break;
                    case "ownedPackages":
                        if (type === "sub") {
                            owned.push(strId);
                        }
                        break;
                }
            }
        }

        return {ignored, ignoredOwned, owned, wishlisted};
    }

    private async dynamicStoreRandomApp(): Promise<number|null> {
        await this.refreshDynamicStore();

        const ownedApps = await IndexedDB.get("dynamicStore", "ownedApps");
        if (!ownedApps || !Array.isArray(ownedApps) || ownedApps.length === 0) {
            return null;
        }

        return ownedApps[Math.floor(Math.random() * ownedApps.length)]!;
    }

    private async clearDynamicStore(): Promise<void> {
        await IndexedDB.clear("dynamicStore");
    }

    private async fetchAppDetails(appid: number, filter: string|undefined=undefined): Promise<TAppDetail|null> {
        const url = this.getUrl("api/appdetails/", {
            appids: appid,
            filter: filter
        });

        const data = await this.fetchJson<{
            [appid: string]: {
                success: boolean,
                data: TAppDetail
            }
        }|null>(url, {credentials: "include"});

        const strAppid = String(appid);
        if (data && data[strAppid]) {
            const details = data[strAppid]!;
            if (details.success) {
                return details.data;
            }
        }
        return null;
    }

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch(message.action) {
            case EAction.Wishlist_Add:
                return this.wishlistAdd(message.params.appid);

            case EAction.Wishlist_Remove:
                return this.wishlistRemove(message.params.appid);

            case EAction.AppDetails:
                return this.fetchAppDetails(message.params.appid, message.params.filter ?? undefined);

            case EAction.Currency:
                return this.getCurrency();

            case EAction.SessionId:
                return this.fetchSessionId();

            case EAction.Purchases:
                return this.getPurchaseDate(message.params.appName, message.params.lang);

            case EAction.Purchases_Clear:
                return this.clearPurchases();

            case EAction.DynamicStore_Clear:
                return this.clearDynamicStore();

            case EAction.DynamicStore_Status:
                return this.getDynamicStoreStatus(message.params.ids);

            case EAction.DynamicStore_RandomApp:
                return this.dynamicStoreRandomApp();
        }

        return Unrecognized;
    }
}
