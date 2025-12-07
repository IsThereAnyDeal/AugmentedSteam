import Background from "@Core/Background";
import {EAction} from "@Background/EAction";
import type {HasItemResponse} from "@Background/Modules/Inventory/_types";

export default class InventoryApiFacade {

    static async getGiftsAppids(appids: number[]): Promise<Set<string>> {
        return new Set<string>(
            await Background.send(EAction.Inventory_GetGiftsAppids, {appids})
        );
    }

    static async getPassesAppids(appids: number[]): Promise<Set<string>> {
        return new Set<string>(
            await Background.send(EAction.Inventory_GetPassesAppids, {appids})
        );
    }

    static hasItem(hashes: string[]): Promise<HasItemResponse> {
        return Background.send(EAction.Inventory_HasItem, {hashes});
    }
}
