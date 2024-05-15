import BackgroundSender from "@Core/BackgroundSimple";
import type {
    TFetchDlcInfoResponse,
    TFetchMarketCardAveragePricesResponse,
    TFetchMarketCardPricesResponse,
    TFetchPricesResponse,
    TFetchProfileBackgroundsGamesResponse,
    TFetchProfileBackgroundsResponse,
    TFetchRatesResponse,
    TFetchStorePageDataResponse,
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
        return BackgroundSender.send2(EAction.Prices, {country, apps, subs, bundles, voucher, shops});
    }

    static fetchDlcInfo(appid: number): Promise<TFetchDlcInfoResponse> {
        return BackgroundSender.send2(EAction.DlcInfo, {appid});
    }

    static getStorePageData(appid: number): Promise<TFetchStorePageDataResponse> {
        return BackgroundSender.send2(EAction.DlcInfo, {appid});
    }

    static expireStorePageData(appid: number): Promise<void> {
        return BackgroundSender.send2(EAction.StorePageData_Expire, {appid});
    }

    static getRates(to: string[]): Promise<TFetchRatesResponse> {
        return BackgroundSender.send2(EAction.Rates, {to});
    }

    static clearRates(): Promise<void> {
        return BackgroundSender.send2(EAction.Rates_Clear);
    }

    static isEarlyAccess(appids: number[]): Promise<TIsEarlyAccessResponse> {
        return BackgroundSender.send2(EAction.IsEA, {appids});
    }

    static fetchProfileBackground(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        return BackgroundSender.send2(EAction.ProfileBackground, {appid});
    }

    static fetchProfileBackgroundGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        return BackgroundSender.send2(EAction.ProfileBackgroundGames);
    }

    static fetchTwitchStream(channelId: string): Promise<TFetchTwitchStreamResponse> {
        return BackgroundSender.send2(EAction.TwitchStream, {channelId});
    }

    static fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        return BackgroundSender.send2(EAction.Market_CardPrices, {currency, appid});
    }

    static fetchMarketCardAveragePrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        return BackgroundSender.send2(EAction.Market_AverageCardPrices, {currency, appids});
    }

    static fetchSimilar(appid: number): Promise<TSimilarResponse> {
        return BackgroundSender.send2(EAction.SteamPeek, {appid});
    }

    static async getProfileData(steamId: string): Promise<TProfileData> {
        return BackgroundSender.send2(EAction.Profile, {steamId});
    }

    static clearOwn(steamId: string): Promise<void> {
        return BackgroundSender.send2(EAction.Profile_Clear, {steamId});
    }
}
