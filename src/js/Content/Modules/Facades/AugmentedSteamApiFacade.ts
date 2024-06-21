import Background from "@Core/Background";
import type {
    TDlcInfo,
    TFetchMarketCardAveragePricesResponse,
    TFetchMarketCardPricesResponse,
    TFetchPricesResponse,
    TFetchProfileBackgroundsGamesResponse,
    TFetchProfileBackgroundsResponse,
    TFetchRatesResponse,
    TStorePageData,
    TFetchTwitchStreamResponse,
    TIsEarlyAccessResponse, TProfileData,
    TSimilarResponse
} from "@Background/Modules/AugmentedSteam/_types";
import {EAction} from "@Background/EAction";

export default class AugmentedSteamApiFacade {

    static fetchPrices(
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    ): Promise<TFetchPricesResponse> {
        return Background.send(EAction.Prices, {country, apps, subs, bundles, voucher, shops});
    }

    static fetchDlcInfo(appid: number): Promise<TDlcInfo> {
        return Background.send(EAction.DlcInfo, {appid});
    }

    static getStorePageData(appid: number): Promise<TStorePageData> {
        return Background.send(EAction.StorePageData, {appid});
    }

    static expireStorePageData(appid: number): Promise<void> {
        return Background.send(EAction.StorePageData_Expire, {appid});
    }

    static getRates(to: string[]): Promise<TFetchRatesResponse> {
        return Background.send(EAction.Rates, {to});
    }

    static clearRates(): Promise<void> {
        return Background.send(EAction.Rates_Clear);
    }

    static isEarlyAccess(appids: number[]): Promise<TIsEarlyAccessResponse> {
        return Background.send(EAction.IsEA, {appids});
    }

    static fetchProfileBackground(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        return Background.send(EAction.ProfileBackground, {appid});
    }

    static fetchProfileBackgroundGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        return Background.send(EAction.ProfileBackgroundGames);
    }

    static fetchTwitchStream(channelId: string): Promise<TFetchTwitchStreamResponse> {
        return Background.send(EAction.TwitchStream, {channelId});
    }

    static fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        return Background.send(EAction.Market_CardPrices, {currency, appid});
    }

    static fetchMarketCardAveragePrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        return Background.send(EAction.Market_AverageCardPrices, {currency, appids});
    }

    static fetchSteamPeek(appid: number): Promise<TSimilarResponse> {
        return Background.send(EAction.SteamPeek, {appid});
    }

    static async getProfileData(steamId: string): Promise<TProfileData> {
        return Background.send(EAction.Profile, {steamId});
    }

    static clearOwn(steamId: string): Promise<void> {
        return Background.send(EAction.Profile_Clear, {steamId});
    }
}
