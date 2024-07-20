import IndexedDB from "@Background/Db/IndexedDB";
import Config from "config";
import Api from "../Api";
import type {
    TProfileData,
    TDlcInfo,
    TFetchMarketCardAveragePricesResponse,
    TFetchMarketCardPricesResponse,
    TFetchPricesResponse,
    TFetchProfileBackgroundsGamesResponse,
    TFetchProfileBackgroundsResponse,
    TFetchRatesResponse,
    TStorePageData,
    TFetchTwitchStreamResponse,
    TIsEarlyAccessResponse,
    TSimilarResponse
} from "@Background/Modules/AugmentedSteam/_types";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {EAction} from "@Background/EAction";
import TimeUtils from "@Core/Utils/TimeUtils";
import {Unrecognized} from "@Background/background";

export default class AugmentedSteamApi extends Api implements MessageHandlerInterface{

    constructor() {
        super(Config.ApiServerHost);
    }

    private fetchStorePageData(appid: number): Promise<TStorePageData> {
        const url = this.getUrl(`app/${appid}/v2`);
        return this.fetchJson(url);
    }

    private fetchRates(to: string[]): Promise<{[from: string]: {[to: string]: number}}> {
        const url = this.getUrl(`rates/v1`, {to: to.join(",")});
        return this.fetchJson(url);
    }

    private fetchEarlyAccess(): Promise<Array<number>> {
        const url = this.getUrl("early-access/v1");
        return this.fetchJson(url);
    }

    private fetchSteamPeek(appid: number): Promise<TSimilarResponse> {
        const url = this.getUrl(`similar/${appid}/v2`, {count: 15});
        return this.fetchJson(url);
    }

    private fetchDlcInfo(appid: number): Promise<TDlcInfo> {
        const url = this.getUrl(`dlc/${appid}/v2`);
        return this.fetchJson<TDlcInfo>(url);
    }

    private fetchProfile(steamId: string): Promise<TProfileData> {
        const url = this.getUrl(`profile/${steamId}/v2`);
        return this.fetchJson(url);
    }

    private fetchTwitch(twitchChannelId: string): Promise<TFetchTwitchStreamResponse> {
        const url = this.getUrl(`twitch/${twitchChannelId}/stream/v2`);
        return this.fetchJson<TFetchTwitchStreamResponse>(url);
    }

    private fetchProfileBackgrounds(appid: number): Promise<TFetchProfileBackgroundsResponse> {
        const url = this.getUrl("profile/background/list/v2", {appid});
        return this.fetchJson<TFetchProfileBackgroundsResponse>(url);
    }

    private fetchProfileBackgroundsGames(): Promise<TFetchProfileBackgroundsGamesResponse> {
        const url = this.getUrl("profile/background/games/v1");
        return this.fetchJson<TFetchProfileBackgroundsGamesResponse>(url);
    }

    private fetchMarketCardPrices(currency: string, appid: number): Promise<TFetchMarketCardPricesResponse> {
        const url = this.getUrl("market/cards/v2", {currency, appid});
        return this.fetchJson(url);
    }

    private fetchMarketAverageCardPrices(currency: string, appids: number[]): Promise<TFetchMarketCardAveragePricesResponse> {
        const url = this.getUrl("market/cards/average-prices/v2", {
            currency,
            appids: appids.join(",")
        });
        return this.fetchJson(url);
    }

    private fetchPrices(
        country: string,
        apps: number[],
        subs: number[],
        bundles: number[],
        voucher: boolean,
        shops: number[]
    ): Promise<TFetchPricesResponse> {
        const url = this.getUrl("prices/v2");

        return this.fetchJson<TFetchPricesResponse>(url, {
            method: "POST",
            body: JSON.stringify({country, apps, subs, bundles, voucher, shops})
        });
    }

    private async getProfileData(steamId: string): Promise<TProfileData> {
        const ttl = 24*60*60;

        let data = await IndexedDB.get("profiles", steamId);

        if (!data || TimeUtils.isInPast(data.expiry)) {
            data = {
                data: await this.fetchProfile(steamId),
                expiry: TimeUtils.now() + ttl
            };
            await IndexedDB.put("profiles", data, steamId);
        }

        return data.data;
    }

    private clearOwn(steamId: string): Promise<void> {
        return IndexedDB.delete("profiles", steamId);
    }

    async getStorePageData(appid: number): Promise<TStorePageData> {
        const ttl = 60*60;

        let data = await IndexedDB.get("storePageData", appid);

        if (!data || TimeUtils.isInPast(data.expiry)) {
            data = {
                data: await this.fetchStorePageData(appid),
                expiry: TimeUtils.now() + ttl
            }
            await IndexedDB.put("storePageData", data, appid);
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

    async isEarlyAccess(appids: number[]): Promise<TIsEarlyAccessResponse> {
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

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch (message.action) {

            case EAction.Prices: {
                const {country, apps, subs, bundles, voucher, shops} = message.params;
                return this.fetchPrices(country, apps, subs, bundles, voucher, shops);
            }

            case EAction.DlcInfo:
                return this.fetchDlcInfo(message.params.appid);

            case EAction.StorePageData:
                return this.getStorePageData(message.params.appid);

            case EAction.StorePageData_Expire:
                return this.expireStorePageData(message.params.appid);

            case EAction.Rates:
                return this.getRates(message.params.to);

            case EAction.Rates_Clear:
                return this.clearRates();

            case EAction.IsEA:
                return this.isEarlyAccess(message.params.appids);

            case EAction.ProfileBackground:
                return this.fetchProfileBackgrounds(message.params.appid);

            case EAction.ProfileBackgroundGames:
                return this.fetchProfileBackgroundsGames();

            case EAction.TwitchStream:
                return this.fetchTwitch(message.params.channelId);

            case EAction.Market_CardPrices:
                return this.fetchMarketCardPrices(message.params.currency, message.params.appid);

            case EAction.Market_AverageCardPrices:
                return this.fetchMarketAverageCardPrices(message.params.currency, message.params.appids);

            case EAction.SteamPeek:
                return this.fetchSteamPeek(message.params.appid);

            case EAction.Profile:
                return this.getProfileData(message.params.steamId);

            case EAction.Profile_Clear:
                return this.clearOwn(message.params.steamId);
        }

        return Unrecognized;
    }
}
