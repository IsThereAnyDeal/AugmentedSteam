import {TimeUtils} from "../../../modulesCore";
import IndexedDB from "../IndexedDB";
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
import type ApiHandlerInterface from "@Background/ApiHandlerInterface";
import {EMessage} from "@Background/Modules/AugmentedSteam/EMessage";

export default class AugmentedSteamApi extends Api implements ApiHandlerInterface{

    constructor() {
        super(Config.ApiServerHost);
    }

    private async fetchStorePageData(appid: number): Promise<TFetchStorePageDataResponse> {
        const url = this.getApiUrl(`app/${appid}/v2`);
        return this.fetchJson(url);
    }

    private async fetchRates(to: string[]): Promise<{[from: string]: {[to: string]: number}}> {
        const url = this.getApiUrl(`rates/v1`, {to: to.join(",")});
        return await this.fetchJson(url);
    }

    private async fetchEarlyAccess(): Promise<Array<number>> {
        const url = this.getApiUrl("early-access/v1");
        return this.fetchJson(url);
    }

    private async fetchSteamPeek(appid: number): Promise<TSimilarResponse> {
        const url = this.getApiUrl(`similar/${appid}/v2`, {count: 15});
        return await this.fetchJson(url);
    }

    private async fetchDlcInfo(appid: number): Promise<TFetchDlcInfoResponse> {
        const url = this.getApiUrl(`dlc/${appid}/v2`);
        return this.fetchJson<TFetchDlcInfoResponse>(url);
    }

    private async fetchProfile(steamId: string): Promise<TProfileData> {
        const url = this.getApiUrl(`profile/${steamId}/v2`);
        return await this.fetchJson(url);
    }

    private async fetchTwitch(twitchChannelId: string): Promise<TFetchTwitchStreamResponse> {
        const url = this.getApiUrl(`twitch/${twitchChannelId}/stream/v2`);
        return this.fetchJson<TFetchTwitchStreamResponse>(url);
    }

    private async fetchProfileBackgrounds(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        const url = this.getApiUrl("profile/background/list/v2", {appid});
        return this.fetchJson<TFetchProfileBackgroundsResponse>(url);
    }

    private async fetchProfileBackgroundsGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        const url = this.getApiUrl("profile/background/games/v1");
        return this.fetchJson<TFetchProfileBackgroundsGamesResponse>(url);
    }

    private async fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        const url = this.getApiUrl("market/cards/v2", {currency, appid});
        return this.fetchJson(url);
    }

    private async fetchMarketAverageCardPrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        const url = this.getApiUrl("market/cards/average-prices/v2", {
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
        const url = this.getApiUrl("prices/v2");

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

            await IndexedDB.putAll(
                "earlyAccessAppids",
                appids.map(appid => [appid, appid]),
            );
            await IndexedDB.setStoreExpiry("earlyAccessAppids", ttl)
        }

        return IndexedDB.contains("earlyAccessAppids", appids);
    }

    async handle(message: any) {

        switch (message.action) {

            case EMessage.Prices: {
                const params = message.params;
                const {country, apps, subs, bundles, voucher, shops} = params;
                return await this.fetchPrices(country, apps, subs, bundles, voucher, shops);
            }

            case EMessage.DlcInfo:
                return await this.fetchDlcInfo(message.params.appid);

            case EMessage.StorePageData:
                return await this.getStorePageData(message.params.appid);

            case EMessage.ExpireStorePageData:
                return await this.expireStorePageData(message.params.appid);

            case EMessage.Rates:
                return await this.getRates(message.params.to);

            case EMessage.ClearRates:
                return await this.clearRates();

            case EMessage.IsEA:
                return await this.isEA(message.params.appids);

            case EMessage.ProfileBackground:
                return await this.fetchProfileBackgrounds(message.params.appid);

            case EMessage.ProfileBackgroundGames:
                return await this.fetchProfileBackgroundsGames();

            case EMessage.TwitchStream:
                return await this.fetchTwitch(message.params.channelId);

            case EMessage.MarketCardPrices:
                return await this.fetchMarketCardPrices(message.params.currency, message.params.appid);

            case EMessage.MarketAverageCardPrices:
                return await this.fetchMarketAverageCardPrices(message.params.currency, message.params.appids);

            case EMessage.SteamPeek:
                return await this.fetchSteamPeek(message.params.appid);
        }

        return undefined;
    }
}
