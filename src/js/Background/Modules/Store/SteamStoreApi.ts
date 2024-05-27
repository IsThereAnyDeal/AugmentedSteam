import Api from "../Api";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import IndexedDB from "@Background/Db/IndexedDB";
import type {
    TAppDetail,
    TDynamicStoreStatusResponse,
    TFetchWishlistResponse,
    TPackageDetail,
    TWishlistGame
} from "./_types";
import LocalStorage from "@Core/Storage/LocalStorage";
import {EAction} from "@Background/EAction";
import Errors from "@Core/Errors/Errors";
import HTMLParser from "@Core/Html/HtmlParser";
import HTML from "@Core/Html/Html";
import TimeUtils from "@Core/Utils/TimeUtils";
import StringUtils from "@Core/Utils/StringUtils";
import {Unrecognized} from "@Background/background";

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
            const url = this.getUrl("/api/addtowishlist", {sessionid, appid});
            result = await this.fetchJson(url, {
                method: "POST",
                credentials: "include"
            });
        }

        if (!result || !result.success) {
            throw new Error(`Failed to add app ${appid} to wishlist`);
        }

        await this.clearDynamicStore();
    }

    private async wishlistRemove(appid: number, sessionId: string|null): Promise<void> {
        let result: Record<string, any>|undefined;

        if (!sessionId) {
            sessionId = await this.fetchSessionId();
        }

        if (sessionId) {
            const url = this.getUrl("/api/removefromwishlist", {sessionid: sessionId, appid})
            result = await this.fetchJson(url, {
                method: "POST",
                credentials: "include"
            });
        }

        if (!result || !result.success) {
            throw new Error(`Failed to remove app ${appid} from wishlist`);
        }

        await this.clearDynamicStore();
    }

    private async getCurrencyFromWallet(parser: DOMParser): Promise<string|null> {
        const url = this.getUrl("/steamaccount/addfunds");
        const html = await this.fetchPage(url);
        const doc = parser.parseFromString(html, "text/html");

        return doc.querySelector<HTMLInputElement>("input[name=currency]")?.value ?? null;
    }

    private async getCurrencyFromApp(parser: DOMParser): Promise<string|null> {
        const url = this.getUrl("/app/220");
        const html = await this.fetchPage(url);
        const doc = parser.parseFromString(html, "text/html");

        return doc.querySelector("meta[itemprop=priceCurrency][content]")?.getAttribute("content") ?? null;
    }

    private async getCurrency(): Promise<string> {
        let stored = await LocalStorage.get("currency");
        if (stored && TimeUtils.isInFuture(stored.expiry)) {
            return stored.data;
        }

        const parser = new DOMParser();

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

    private async fetchWishlistCount(path: string): Promise<TFetchWishlistResponse> {
        const url = this.getUrl(`/wishlist${path}`);
        const html = await this.fetchPage(url);
        const data = HTMLParser.getArrayVariable<TWishlistGame>("g_rgWishlistData", html);
        return data?.length ?? null;
    }

    private async fetchPurchaseDates(lang: string): Promise<Map<string, string>> {
        const replaceRegex = [
            /- Complete Pack/ig,
            /Standard Edition/ig,
            /Steam Store and Retail Key/ig,
            /- Hardware Survey/ig,
            /ComputerGamesRO -/ig,
            /Founder Edition/ig,
            /Retail( Key)?/ig,
            /Complete$/ig,
            /Launch$/ig,
            /Free$/ig,
            /(RoW)/ig,
            /ROW/ig,
            /:/ig,
        ];
        const purchaseDates = new Map();

        const url = this.getUrl("/account/licenses/", {"l": lang});
        const html = await this.fetchPage(url);

        const dummyPage = HTML.toDom(html);
        const nodes = dummyPage.querySelectorAll<HTMLTableCellElement>("#main_content td.license_date_col");
        for (const node of nodes) {
            const name = node.nextElementSibling;
            if (!name) {
                continue;
            }

            const removeNode = name.querySelector("div");
            if (removeNode) {
                removeNode.remove();
            }

            let appName = StringUtils.clearSpecialSymbols(name.textContent!.trim());
            for (const regex of replaceRegex) {
                appName = appName.replace(regex, "");
            }
            appName = appName.trim();
            purchaseDates.set(appName, node.textContent);
        }

        return purchaseDates;
    }

    private async getPurchaseDate(appName: string, lang: string): Promise<string|null> {
        if (await IndexedDB.isStoreExpired("purchases")) {
            const purchaseDates = await this.fetchPurchaseDates(lang);
            await IndexedDB.putMany("purchases", [...purchaseDates.entries()]);
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
        await IndexedDB.setStoreExpiry("dynamicStore", 15*60);
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

    async handle(message: any): Promise<any> {

        switch(message.action) {
            case EAction.Wishlist_Add:
                return await this.wishlistAdd(message.params.appid);

            case EAction.Wishlist_Remove:
                return await this.wishlistRemove(message.params.appid, message.params.sessionId ?? null);

            case EAction.Wishlists:
                return await this.fetchWishlistCount(message.params.path);

            case EAction.AppDetails:
                return await this.fetchAppDetails(message.params.appid, message.params.filter ?? undefined);

            case EAction.Currency:
                return await this.getCurrency();

            case EAction.SessionId:
                return await this.fetchSessionId();

            case EAction.Purchases:
                return await this.getPurchaseDate(message.params.appName, message.params.lang);

            case EAction.Purchases_Clear:
                return await this.clearPurchases();

            case EAction.DynamicStore_Clear:
                return await this.clearDynamicStore();

            case EAction.DynamicStore_Status:
                return await this.getDynamicStoreStatus(message.params.ids);

            case EAction.DynamicStore_RandomApp:
                return await this.dynamicStoreRandomApp();
        }

        return Unrecognized;
    }
}
