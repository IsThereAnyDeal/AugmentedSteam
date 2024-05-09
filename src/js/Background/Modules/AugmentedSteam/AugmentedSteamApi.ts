import IndexedDB from "@Background/Db/IndexedDB";
import Config from "../../../config";
import Api from "../Api";
import type {
    TProfileData,
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
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {EAction} from "@Background/EAction";
import TimeUtils from "@Core/Utils/TimeUtils";

export default class AugmentedSteamApi extends Api implements MessageHandlerInterface{

    constructor() {
        super(Config.ApiServerHost);
    }

    private async fetchStorePageData(appid: number): Promise<TFetchStorePageDataResponse> {
        const url = this.getUrl(`app/${appid}/v2`);
        return this.fetchJson(url);
    }

    private async fetchRates(to: string[]): Promise<{[from: string]: {[to: string]: number}}> {
        const url = this.getUrl(`rates/v1`, {to: to.join(",")});
        return await this.fetchJson(url);
    }

    private async fetchEarlyAccess(): Promise<Array<number>> {
        const url = this.getUrl("early-access/v1");
        return this.fetchJson(url);
    }

    private async fetchSteamPeek(appid: number): Promise<TSimilarResponse> {
        const url = this.getUrl(`similar/${appid}/v2`, {count: 15});
        return await this.fetchJson(url);
    }

    private async fetchDlcInfo(appid: number): Promise<TFetchDlcInfoResponse> {
        const url = this.getUrl(`dlc/${appid}/v2`);
        return this.fetchJson<TFetchDlcInfoResponse>(url);
    }

    private async fetchProfile(steamId: string): Promise<TProfileData> {
        const url = this.getUrl(`profile/${steamId}/v2`);
        return await this.fetchJson(url);
    }

    private async fetchTwitch(twitchChannelId: string): Promise<TFetchTwitchStreamResponse> {
        const url = this.getUrl(`twitch/${twitchChannelId}/stream/v2`);
        return this.fetchJson<TFetchTwitchStreamResponse>(url);
    }

    private async fetchProfileBackgrounds(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        const url = this.getUrl("profile/background/list/v2", {appid});
        return this.fetchJson<TFetchProfileBackgroundsResponse>(url);
    }

    private async fetchProfileBackgroundsGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        const url = this.getUrl("profile/background/games/v1");
        return this.fetchJson<TFetchProfileBackgroundsGamesResponse>(url);
    }

    private async fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        const url = this.getUrl("market/cards/v2", {currency, appid});
        return this.fetchJson(url);
    }

    private async fetchMarketAverageCardPrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        const url = this.getUrl("market/cards/average-prices/v2", {
            currency,
            appids: appids.join(",")
        });
        return this.fetchJson(url);
    }

    private async fetchPrices(
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    ): Promise<TFetchPricesResponse> {
        const url = this.getUrl("prices/v2");

        return await this.fetchJson<TFetchPricesResponse>(url, {
            method: "POST",
            body: JSON.stringify({country, apps, subs, bundles, voucher, shops})
        });
    }

    private async getProfileData(steamId: string): Promise<TProfileData> {
        const ttl = 24*60*60;

        let data = await IndexedDB.get("profiles", steamId);

        if (!data || TimeUtils.isInPast(data.expiry)) {
            data = {
                data: this.fetchProfile(steamId),
                expiry: TimeUtils.now() + ttl
            };
            await IndexedDB.put("profiles", data, steamId);
        }

        return data.data;
    }

    private clearOwn(steamId: string) {
        return IndexedDB.delete("profiles", steamId);
    }

    async getStorePageData(appid: number): Promise<TFetchStorePageDataResponse> {
        const ttl = 60*60;
        let data = await IndexedDB.get("storePageData", appid);

        if (!data || TimeUtils.isInPast(data.expiry)) {
            data = {
                data: await this.fetchStorePageData(appid),
                expiry: TimeUtils.now() + ttl
            }

            await IndexedDB.put("storePageData", data,appid);
        }
        return data.data;
    }

    expireStorePageData(appid: number): Promise<void> {
        return IndexedDB.delete("storePageData", appid);
    }

    async getRates(to: string[]): Promise<TFetchRatesResponse> {
        const ttl = 60*60;
        const key = to.join(",");

        let rates = await IndexedDB.get("rates", key);

        if (!rates || TimeUtils.isInPast(rates.expiry)) {
            rates = {
                data: await this.fetchRates(to),
                expiry: TimeUtils.now() + ttl
            };
            await IndexedDB.put("rates", rates, key);
        }
        return rates.data;
    }

    clearRates() {
        return IndexedDB.clear("rates");
    }

    async isEA(appids: number[]): Promise<TIsEarlyAccessResponse> {
        const ttl = 2*60*60;
        const isExpired = await IndexedDB.isStoreExpired("earlyAccessAppids");

        if (isExpired) {
            const appids = await this.fetchEarlyAccess();

            await IndexedDB.replaceAll(
                "earlyAccessAppids",
                appids.map(appid => [appid, appid]),
            );
            await IndexedDB.setStoreExpiry("earlyAccessAppids", ttl)
        }

        return IndexedDB.contains("earlyAccessAppids", appids);
    }

    async handle(message: any) {

        switch (message.action) {

            case EAction.Prices: {
                const params = message.params;
                const {country, apps, subs, bundles, voucher, shops} = params;
                return await this.fetchPrices(country, apps, subs, bundles, voucher, shops);
            }

            case EAction.DlcInfo:
                return await this.fetchDlcInfo(message.params.appid);

            case EAction.StorePageData:
                return await this.getStorePageData(message.params.appid);

            case EAction.StorePageData_Expire:
                return await this.expireStorePageData(message.params.appid);

            case EAction.Rates:
                return await this.getRates(message.params.to);

            case EAction.Rates_Clear:
                return await this.clearRates();

            case EAction.IsEA:
                return await this.isEA(message.params.appids);

            case EAction.ProfileBackground:
                return await this.fetchProfileBackgrounds(message.params.appid);

            case EAction.ProfileBackgroundGames:
                return await this.fetchProfileBackgroundsGames();

            case EAction.TwitchStream:
                return await this.fetchTwitch(message.params.channelId);

            case EAction.Market_CardPrices:
                return await this.fetchMarketCardPrices(message.params.currency, message.params.appid);

            case EAction.Market_AverageCardPrices:
                return await this.fetchMarketAverageCardPrices(message.params.currency, message.params.appids);

            case EAction.SteamPeek:
                return await this.fetchSteamPeek(message.params.appid);

            case EAction.Profile:
                return await this.getProfileData(message.params.steamId);

            case EAction.Profile_Clear:
                return await this.clearOwn(message.params.steamId);
        }

        return undefined;
    }
}
