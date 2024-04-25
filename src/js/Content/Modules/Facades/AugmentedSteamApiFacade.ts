import {BackgroundSender} from "@Core/BackgroundSimple";
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
    TIsEarlyAccessResponse,
    TSimilarResponse
} from "@Background/Modules/AugmentedSteam/_types";

export default class AugmentedSteamApiFacade {

    static fetchPrices(
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    ): Promise<TFetchPricesResponse> {
        return BackgroundSender.send({
            action: EMessage.Prices,
            params: {country, apps, subs, bundles, voucher, shops}
        });
    }

    static fetchDlcInfo(appid: number): Promise<TFetchDlcInfoResponse> {
        return BackgroundSender.send2(EMessage.DlcInfo, {appid});
    }

    static getStorePageData(appid: number): Promise<TFetchStorePageDataResponse> {
        return BackgroundSender.send2(EMessage.DlcInfo, {appid});
    }

    static expireStorePageData(appid: number): Promise<void> {
        return BackgroundSender.send2(EMessage.ExpireStorePageData, {appid});
    }

    static fetchRates(to: string[]): Promise<TFetchRatesResponse> {
        return BackgroundSender.send2(EMessage.Rates, {to});
    }

    static clearRates(): Promise<void> {
        return BackgroundSender.send2(EMessage.ClearRates);
    }

    static isEarlyAccess(appids: number[]): Promise<TIsEarlyAccessResponse> {
        return BackgroundSender.send2(EMessage.IsEA, {appids});
    }

    static fetchProfileBackground(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        return BackgroundSender.send2(EMessage.ProfileBackground, {appid});
    }

    static fetchProfileBackgroundGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        return BackgroundSender.send2(EMessage.ProfileBackgroundGames);
    }

    static fetchTwitchStream(channelId: string): Promise<TFetchTwitchStreamResponse> {
        return BackgroundSender.send2(EMessage.TwitchStream, {channelId});
    }

    static fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        return BackgroundSender.send2(EMessage.MarketCardPrices, {currency, appid});
    }

    static fetchMarketCardAveragePrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        return BackgroundSender.send2(EMessage.MarketAverageCardPrices, {currency, appids});
    }

    static fetchSimilar(appid: number): Promise<TSimilarResponse> {
        return BackgroundSender.send2(EMessage.SteamPeek, {appid});
    }
}
