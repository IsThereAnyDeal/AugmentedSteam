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
        const country = this.info.country;
        const walletCurrency = this.info.walletCurrency;

        // load nameid
        const itemResponse = await RequestData.getText(`https://steamcommunity.com/market/listings/${globalId}/${encodeURIComponent(hashName)}`);

        const m = itemResponse.match(/Market_LoadOrderSpread\( (\d+) \)/);
        if (!m) {
            console.error("Failed to get nameId for item '%s'", hashName);
            return null;
        }
        const itemNameId = Number(m[1]);

        // load prices
        const priceResponse = await RequestData.getJson<{
            success?: boolean,
            highest_buy_order?: string,
            lowest_sell_order?: string
        }>(`https://steamcommunity.com/market/itemordershistogram?country=${country}&language=english&currency=${walletCurrency}&item_nameid=${itemNameId}`);

        if (!priceResponse || !priceResponse.success) {
            console.error("Failed to get market prices for item '%s'", hashName);
            return null;
        }

        let priceLow = Number(priceResponse.highest_buy_order);
        let priceHigh = Number(priceResponse.lowest_sell_order);

        if (priceHigh > 0) {
            const diff = Settings.quickinv_diff;
            priceHigh = Math.max((priceHigh / 100) + Number(diff), this.info.lowestListingPrice) || 0;
            priceHigh = Number(priceHigh.toFixed(2)) * 100;
        }

        const currencyType = CurrencyManager.currencyIdToCode(walletCurrency);

        let priceLowFormatted = await SteamFacade.vCurrencyFormat(priceLow, currencyType);
        let priceHighFormatted = await SteamFacade.vCurrencyFormat(priceHigh, currencyType);

        return {
            low: priceLow,
            high: priceHigh,
            lowFormatted: priceLowFormatted,
            highFormatted: priceHighFormatted,
        }
    }

    get promise(): Promise<IPriceResponse|null> {
        return this._promise;
    }
}