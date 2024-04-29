import {Errors, GameId, LocalStorage} from "../../../modulesCore";
import type {TCoupon} from "@Background/Modules/Community/_types";
import IndexedDB from "@Background/Modules/IndexedDB";
import Api from "@Background/Modules/Api";
import type ApiHandlerInterface from "@Background/ApiHandlerInterface";
import {
    ContextId,
    type HasGiftsAndPassesResponse,
    type InventoryData,
    type InventoryResponse
} from "@Background/Modules/Inventory/_types";
import {EMessage} from "./EMessage";
import {SteamStoreApi} from "@Background/Modules/SteamStoreApi";


export default class InventoryApi extends Api implements ApiHandlerInterface {

    constructor() {
        super("https://steamcommunity.com/");
    }

    private async loadInventory(contextId: number) {
        const login = await LocalStorage.get("login");

        if (!login || !login.steamId) {
            console.warn("Must be signed in to access Inventory");
            return null;
        }

        let data: InventoryData|null = null;

        let url = new URL(`/inventory/${login.steamId}/753/${contextId}`, "https://steamcommunity.com/");
        url.searchParams.set("l", "english");
        url.searchParams.set("count", "2000");

        let hasMoreItems = false;
        do {
            hasMoreItems = false;

            let response = await fetch(url, {credentials: "include"});

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Errors.LoginError("community");
                }

                throw new Errors.HTTPError(response.status, response.statusText);
            }

            let result: InventoryResponse = await response.json();

            if (result && result.success) {
                if (!data) {
                    data = {
                        "assets": [],
                        "descriptions": []
                    };
                }
                if (result.assets) {
                    data.assets.push(...result.assets);
                }
                if (result.descriptions) {
                    data.descriptions.push(...result.descriptions);
                }

                if (result.last_assetid) {
                    url.searchParams.set("start_assetid", result.last_assetid);
                }

                if (result.more_items) {
                    hasMoreItems = true;
                }
            }
        } while (hasMoreItems);

        if (!data) {
            throw new Error(`Could not retrieve Inventory 753/${contextId}`);
        }

        return data;
    }

    private async fetchCoupons() {
        const data = await this.loadInventory(ContextId.Coupons);
        if (!data) {
            return null;
        }

        const coupons: Map<number, TCoupon> = new Map();

        for (const description of data.descriptions) {
            if (!description.type || description.type !== "Coupon") {
                continue;
            }
            if (!description.actions) {
                continue;
            }

            const coupon: TCoupon = {
                appids: [],
                image_url: description.icon_url,
                title: description.name,
                discount: Number(description.name.match(/([1-9][0-9])%/)![1]),
                id: `${description.classid}_${description.instanceid}`
            };
            description.descriptions.forEach((desc, i) => {
                const value = desc.value;
                if (value.startsWith("Can't be applied with other discounts.")) {
                    coupon.discount_note = value;
                    coupon.discount_note_id = i;
                    coupon.discount_doesnt_stack = true;
                } else if (value.startsWith("(Valid")) {
                    coupon.valid_id = i;
                    coupon.valid = value;
                }
            });

            for (const action of description.actions) {
                const match = action.link.match(/[1-9][0-9]*(?:,[1-9][0-9]*)*/);
                if (!match) {
                    console.warn("Couldn't find packageid(s) for link %s", action.link);
                    continue;
                }

                for (let packageidStr of match[0].split(",")) {
                    let packageid = Number(packageidStr);
                    if (!coupons.has(packageid) || coupons.get(packageid)!.discount < coupon.discount) {
                        coupons.set(packageid, coupon);
                    }
                }
            }
        }

        // FIXME
        (new SteamStoreApi()).fetchPackagesOrSomething();
        const packages = await IndexedDB.get("packages", Array.from(coupons.keys()));
        for (const [subid, coupon] of coupons.entries()) {
            const details = packages[subid];
            coupon.appids = details ?? [];
        }

        return coupons;
    }

    private async fetchGiftsAndPasses() { // context#1, gifts and guest passes
        const data = await this.loadInventory(ContextId.GiftsAndPasses);
        if (!data) {
            return null;
        }

        const gifts: number[] = [];
        const passes: number[] = [];

        let isPackage = false;
        for (const description of data.descriptions) {

            const desc = description.descriptions?.find(d => d.type === "html");
            if (desc) {
                const appids = GameId.getAppids(desc.value);
                if (appids.length > 0) {

                    // Gift package with multiple apps
                    isPackage = true;

                    for (const appid of appids) {
                        if (description.type === "Gift") {
                            gifts.push(appid);
                        } else {
                            passes.push(appid);
                        }
                    }
                }
            }

            // Single app
            if (!isPackage && description.actions && description.actions.length > 1) {
                const appid = GameId.getAppid(description.actions[0]!.link);
                if (appid) {
                    if (description.type === "Gift") {
                        gifts.push(appid);
                    } else {
                        passes.push(appid);
                    }
                }
            }
        }

        return {gifts, passes};
    }

    private async fetchItems() {
        const data = await this.loadInventory(ContextId.CommunityItems);
        if (!data) {
            return null;
        }

        return data.descriptions.map(item => item.market_hash_name);
    }

    private async getCoupon(appid: number): Promise<TCoupon|undefined> {
        const isExpired = await IndexedDB.isStoreExpired("coupons");
        if (isExpired) {
            let coupons = await this.fetchCoupons();
            if (coupons === null) {
                await IndexedDB.clear("coupons");
            } else {
                await IndexedDB.putAll("coupons", [...coupons.entries()])
                await IndexedDB.setStoreExpiry("coupons", 60*60);
            }
        }

        return IndexedDB.getFromIndex("coupons", "idx_appid", appid);
    }

    private async hasCoupon(appid: number): Promise<Boolean> {
        const coupon = await this.getCoupon(appid);
        return coupon !== undefined;
    }

    private async hasGiftsAndPasses(appids: number[]): Promise<HasGiftsAndPassesResponse> {
        const isExpired = await IndexedDB.isStoreExpired("giftsAndPasses");
        if (isExpired) {
            let data = await this.fetchGiftsAndPasses();
            if (data === null) {
                await IndexedDB.clear("giftsAndPasses");
            } else {
                await IndexedDB.putAll("giftsAndPasses", [
                    ["gifts", data.gifts],
                    ["passes", data.passes]
                ]);
                await IndexedDB.setStoreExpiry("giftsAndPasses", 60*60);
            }
        }

        const tx = IndexedDB.db.transaction("giftsAndPasses");
        const index = tx.store.index("idx_appid");

        const result = await Promise.all(appids.map(async (appid) => {
            return [appid, await index.getAllKeys(appid)];
        }));

        return Object.fromEntries(result);
    }

    private async hasItem(hashes: string[]) {
        const isExpired = await IndexedDB.isStoreExpired("items");
        if (isExpired) {
            let data = await this.fetchItems();
            if (data === null) {
                await IndexedDB.clear("items");
            } else {
                await IndexedDB.putAll("items", data.map(hash => [hash, hash]));
                await IndexedDB.setStoreExpiry("items", 60*60);
            }
        }

        return await IndexedDB.contains("items", hashes);
    }

    async handle(message: any): Promise<any> {

        switch(message.action) {
            case EMessage.GetCoupon:
                return await this.getCoupon(message.params.appid);

            case EMessage.HasCoupon:
                return await this.hasCoupon(message.params.appid);

            case EMessage.HasGiftsAndPasses:
                return await this.hasGiftsAndPasses(message.params.appids);

            case EMessage.HasItem:
                return await this.hasItem(message.params.hashes);
        }

        return undefined;
    }
}
