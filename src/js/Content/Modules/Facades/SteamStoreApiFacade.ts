import Background from "@Core/Background";
import {EAction} from "@Background/EAction";
import type {TAppDetail, TDynamicStoreStatusResponse, TFetchWishlistResponse} from "@Background/Modules/Store/_types";

export default class SteamStoreApiFacade {

    static async wishlistAdd(appid: number): Promise<void> {
        return await Background.send(EAction.Wishlist_Add, {appid});
    }

    static async wishlistRemove(appid: number, sessionId: string|null=null): Promise<void> {
        return await Background.send(EAction.Wishlist_Remove, {appid, sessionId});
    }

    static async fetchWishlistCount(path: string): Promise<TFetchWishlistResponse> {
        return await Background.send(EAction.Wishlists, {path});
    }

    static async fetchAppDetails(appid: number, filter: string|undefined=undefined): Promise<TAppDetail|null> {
        return await Background.send(EAction.AppDetails, {appid, filter});
    }

    static async getPurchaseDate(appName: string, lang: string): Promise<string|null> {
        return await Background.send(EAction.Purchases, {appName, lang});
    }

    static async getCurrency(): Promise<string> {
        return await Background.send(EAction.Currency);
    }

    static async clearPurchases(): Promise<void> {
        return Background.send(EAction.Purchases_Clear);
    }

    static async clearDynamicStore(): Promise<void> {
        return Background.send(EAction.DynamicStore_Clear);
    }

    static async getDynamicStoreStatus(ids: string[]): Promise<TDynamicStoreStatusResponse> {
        return Background.send(EAction.DynamicStore_Status, {ids});
    }

    static async getDynamicStoreRandomApp(): Promise<number|null> {
        return Background.send(EAction.DynamicStore_RandomApp);
    }
}
