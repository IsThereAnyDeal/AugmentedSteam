import Background from "@Core/Background";
import {EAction} from "@Background/EAction";
import type {TAppDetail, TDynamicStoreStatusResponse} from "@Background/Modules/Store/_types";

export default class SteamStoreApiFacade {

    static wishlistAdd(appid: number): Promise<void> {
        return Background.send(EAction.Wishlist_Add, {appid});
    }

    static wishlistRemove(appid: number): Promise<void> {
        return Background.send(EAction.Wishlist_Remove, {appid});
    }

    static fetchAppDetails(appid: number, filter: string|undefined=undefined): Promise<TAppDetail|null> {
        return Background.send(EAction.AppDetails, {appid, filter});
    }

    static getPurchaseDate(appName: string, lang: string): Promise<string|null> {
        return Background.send(EAction.Purchases, {appName, lang});
    }

    static getCurrency(): Promise<string> {
        return Background.send(EAction.Currency);
    }

    static clearPurchases(): Promise<void> {
        return Background.send(EAction.Purchases_Clear);
    }

    static clearDynamicStore(): Promise<void> {
        return Background.send(EAction.DynamicStore_Clear);
    }

    static getDynamicStoreStatus(ids: string[]): Promise<TDynamicStoreStatusResponse> {
        return Background.send(EAction.DynamicStore_Status, {ids});
    }

    static getDynamicStoreRandomApp(): Promise<number|null> {
        return Background.send(EAction.DynamicStore_RandomApp);
    }
}
