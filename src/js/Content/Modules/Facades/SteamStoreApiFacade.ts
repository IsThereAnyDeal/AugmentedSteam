import BackgroundSender from "@Core/BackgroundSimple";
import {EAction} from "@Background/EAction";
import type {TAppDetail, TDynamicStoreStatusResponse} from "@Background/Modules/Store/_types";

export default class SteamStoreApiFacade {

    static async fetchAppDetails(appid: number, filter: string|undefined=undefined): Promise<TAppDetail|null> {
        return await BackgroundSender.send2(EAction.AppDetails, {appid, filter});
    }

    static async getPurchaseDate(appName: string, lang: string): Promise<string|null> {
        return await BackgroundSender.send2(EAction.Purchases, {appName, lang});
    }

    static async getCurrency(): Promise<string> {
        return await BackgroundSender.send2(EAction.Currency);
    }

    static async clearPurchases(): Promise<void> {
        return BackgroundSender.send2(EAction.Purchases_Clear);
    }

    static async clearDynamicStore(): Promise<void> {
        return BackgroundSender.send2(EAction.DynamicStore_Clear);
    }

    static async getDynamicStoreStatus(ids: string[]): Promise<TDynamicStoreStatusResponse> {
        return BackgroundSender.send2(EAction.DynamicStore_Status, {ids});
    }

    static async getDynamicStoreRandomApp(): Promise<number|null> {
        return BackgroundSender.send2(EAction.DynamicStore_RandomApp);
    }
}
