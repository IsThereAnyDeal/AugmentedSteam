import IndexedDB from "@Background/Db/IndexedDB";
import Api from "@Background/Modules/Api";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {
    ContextId,
    type HasItemResponse,
    type InventoryData,
    type InventoryResponse
} from "@Background/Modules/Inventory/_types";
import {EAction} from "@Background/EAction";
import LocalStorage from "@Core/Storage/LocalStorage";
import Errors from "@Core/Errors/Errors";
import AppId from "@Core/GameId/AppId";
import {Unrecognized} from "@Background/background";


export default class InventoryApi extends Api implements MessageHandlerInterface {

    private refreshGiftsPromise: Promise<void>|undefined;

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
                const appids = AppId.fromText(desc.value);
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
                const appid = AppId.fromUrl(description.actions[0]!.link);
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

    private async refreshGiftsAndPasses(): Promise<void> {
        if (!this.refreshGiftsPromise) {
            this.refreshGiftsPromise = (async() => {
                const isExpired = await IndexedDB.isStoreExpired("giftsAndPasses");
                if (isExpired) {
                    let data = await this.fetchGiftsAndPasses();
                    if (data === null) {
                        await IndexedDB.clear("giftsAndPasses");
                    } else {
                        await IndexedDB.replaceAll("giftsAndPasses", [
                            ["gifts", data.gifts],
                            ["passes", data.passes]
                        ]);
                        await IndexedDB.setStoreExpiry("giftsAndPasses", 60*60);
                    }
                }
            })();
        }
        return this.refreshGiftsPromise;
    }

    private async getGiftsAppids(appids: number[]): Promise<string[]> {
        await this.refreshGiftsAndPasses();

        const tx = IndexedDB.db.transaction("giftsAndPasses");
        const giftsSet = new Set((await tx.store.get("gifts")) ?? []);

        const result: string[] = [];
        for (let appid of appids) {
            if (giftsSet.has(appid)) {
                result.push("app/"+appid);
            }
        }

        await tx.done;
        return result;
    }


    private async getPassesAppids(appids: number[]): Promise<string[]> {
        await this.refreshGiftsAndPasses();

        const tx = IndexedDB.db.transaction("giftsAndPasses");
        const passesSet = new Set((await tx.store.get("passes")) ?? []);

        const result: string[] = [];
        for (let appid of appids) {
            if (passesSet.has(appid)) {
                result.push("app/"+appid);
            }
        }

        await tx.done;
        return result;
    }

    private async hasItem(hashes: string[]): Promise<HasItemResponse> {
        const isExpired = await IndexedDB.isStoreExpired("items");
        if (isExpired) {
            let data = await this.fetchItems();
            if (data === null) {
                await IndexedDB.clear("items");
            } else {
                await IndexedDB.replaceAll("items", data.map(hash => [hash, hash]));
                await IndexedDB.setStoreExpiry("items", 60*60);
            }
        }

        return await IndexedDB.contains("items", hashes);
    }

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch(message.action) {
            case EAction.Inventory_GetGiftsAppids:
                return this.getGiftsAppids(message.params.appids);

            case EAction.Inventory_GetPassesAppids:
                return this.getPassesAppids(message.params.appids);

            case EAction.Inventory_HasItem:
                return this.hasItem(message.params.hashes);
        }

        return Unrecognized;
    }
}
