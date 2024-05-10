import BackgroundSender from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";
import type {HasItemResponse} from "@Background/Modules/Inventory/_types";
import type {TCoupon} from "@Background/Modules/Community/_types";

export default class InventoryApiFacade {

    static getCoupon(appid: number): Promise<TCoupon|undefined> {
        return BackgroundSender.send2(EAction.Inventory_GetCoupon, {appid});
    }

    static async getCouponsAppids(appids: number[]): Promise<Set<number>> {
        return new Set<number>(
            await BackgroundSender.send2(EAction.Inventory_GetCouponsAppids, {appids})
        );
    }

    static async getGiftsAppids(appids: number[]): Promise<Set<number>> {
        return new Set<number>(
            await BackgroundSender.send2(EAction.Inventory_GetGiftsAppids, {appids})
        );
    }

    static async getPassesAppids(appids: number[]): Promise<Set<number>> {
        return new Set<number>(
            await BackgroundSender.send2(EAction.Inventory_GetPassesAppids, {appids})
        );
    }

    static hasItem(hashes: string[]): Promise<HasItemResponse> {
        return BackgroundSender.send2(EAction.Inventory_HasItem, {hashes});
    }
}
