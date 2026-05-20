import RequestData from "@Content/Modules/RequestData";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import type {MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import Settings from "@Options/Data/Settings";

interface IPriceResponse {
    low: number,
    high: number,
    lowFormatted: string
    highFormatted: string
}

export default class MarketPrices {

    private readonly info: MarketInfo;
    private readonly _promise: Promise<IPriceResponse|null>;

    constructor(marketInfo: MarketInfo) {
        this.info = marketInfo;
        this._promise = this.fetchPrices();
    }

    private async fetchPrices(): Promise<IPriceResponse|null> {
        const globalId = this.info.globalId;
        const hashName = this.info.hashName;
        const walletCurrency = this.info.walletCurrency;

        const orderbook = await RequestData.getJson<{
            success: boolean,
            data: {
                amtMaxBuyOrder: number,
                amtMinSellOrder: number,
                eCurrency: number
            }
        }>(`https://steamcommunity.com/market/orderbook?q=Load&qp=${encodeURIComponent(JSON.stringify([globalId,hashName]))}`);
        if (!orderbook.success) {
            return null;
        }

        let priceLow = Number(orderbook.data.amtMaxBuyOrder);
        let priceHigh = Number(orderbook.data.amtMinSellOrder);

        if (priceHigh > 0) {
            const diff = Settings.quickinv_diff;
            priceHigh = Math.max((priceHigh / 100) + Number(diff), 0);
            priceHigh = Number(priceHigh.toFixed(2)) * 100;
        }

        const currencyCode = CurrencyManager.currencyIdToCode(orderbook.data.eCurrency); // walletCurrency?
        return await SteamFacade.getMarketPrices(
            priceLow,
            priceHigh,
            currencyCode,
            this.info.publisherFee
        );
    }

    get promise(): Promise<IPriceResponse|null> {
        return this._promise;
    }
}