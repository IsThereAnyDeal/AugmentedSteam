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
import {Unrecognized} from "@Background/background";


export default class InventoryApi extends Api implements MessageHandlerInterface {

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

    private async fetchItems() {
        const data = await this.loadInventory(ContextId.CommunityItems);
        if (!data) {
            return null;
        }

        return data.descriptions.map(item => item.market_hash_name);
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
            case EAction.Inventory_HasItem:
                return this.hasItem(message.params.hashes);
        }

        return Unrecognized;
    }
}
