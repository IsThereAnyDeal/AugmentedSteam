import HTMLParser from "@Core/Html/HtmlParser";
import type {TCurrency} from "@Core/Currencies";
import Currencies from "@Core/Currencies";
import Settings from "@Options/Data/Settings";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";

export default class CurrencyManager {

    private static promise: Promise<void>;
    private static _rates: Record<string, Record<string, number>>;

    private static readonly _defaultCurrency: string = "USD";
    private static storeCurrencyCode: string;
    private static customCurrencyCode: string;

    static get storeCurrency(): string {
        return this.storeCurrencyCode;
    }

    static get customCurrency(): string {
        return this.customCurrencyCode;
    }

    static getRate(from: string, to: string): number|null {
        if (from === to) {
            return 1;
        }
        return this._rates?.[from]?.[to] ?? null;
    }

    static getCurrencyInfo(code: string): TCurrency {
        for (let currency of Currencies) {
            if (currency.abbr === code) {
                return currency;
            }
        }
        throw new Error("Unknown currency");
    }

    static currencyIdToCode(id: number): string {
        for (let currency of Currencies) {
            if (currency.id  === id) {
                return currency.abbr;
            }
        }
        throw new Error("Unknown currency");
    }

    private static _getCurrencyCodeFromDom(): string|null {
        const currencyNode = document.querySelector("meta[itemprop=priceCurrency][content]");
        if (currencyNode) {
            return currencyNode.getAttribute("content");
        }
        return null
    }

    private static _getCurrencyCodeFromWallet(): string|null {
        const walletInfo = HTMLParser.getObjectVariable("g_rgWalletInfo");
        if (walletInfo && walletInfo.wallet_currency) {
            return this.currencyIdToCode(walletInfo.wallet_currency);
        }
        return null;
    }

    private static async _getStoreCurrency(): Promise<string> {
        let currency = this._getCurrencyCodeFromDom() ?? this._getCurrencyCodeFromWallet();
        if (currency) {
            return currency;
        }

        try {
            return await SteamStoreApiFacade.getCurrency();
        } catch (err) {
            console.error(err);
        }
        return "USD"; // fallback
    }

    private static async _loadCurrency(): Promise<void> {
        const currencySetting = Settings.override_price;
        this.storeCurrencyCode = await this._getStoreCurrency();
        this.customCurrencyCode = (currencySetting === "auto")
            ? this.storeCurrencyCode
            : currencySetting;
    }

    private static async _loadRates(): Promise<void> {
        const toCurrencies = [this.storeCurrencyCode];
        if (this.customCurrencyCode !== this.storeCurrencyCode) {
            toCurrencies.push(this.customCurrencyCode);
        }
        this._rates = await AugmentedSteamApiFacade.getRates(toCurrencies);
    }

    static init(): Promise<void> {
        if (!this.promise) {
            this.promise = (async () => {
                try {
                    await this._loadCurrency();
                    await this._loadRates();
                } catch (err) {
                    console.error("Failed to initialize Currency");
                    console.error(err);
                }
            })();
        }

        return this.promise;
    }
}
