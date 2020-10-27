import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Background} from "../../../Content/common";

export class Currency {

    static _getCurrencyFromDom() {
        const currencyNode = document.querySelector('meta[itemprop="priceCurrency"]');
        if (currencyNode && currencyNode.hasAttribute("content")) {
            return currencyNode.getAttribute("content");
        }
        return null;
    }

    static async _getCurrencyFromWallet() {
        const walletCurrency = await ExtensionLayer.runInPageContext(
            // eslint-disable-next-line no-undef, camelcase
            () => (typeof g_rgWalletInfo !== "undefined" && g_rgWalletInfo ? g_rgWalletInfo.wallet_currency : null),
            null,
            "walletCurrency"
        );

        if (walletCurrency) {
            return Currency.currencyNumberToType(walletCurrency);
        }
        return null;
    }

    static async _getStoreCurrency() {
        let currency = Currency._getCurrencyFromDom();

        if (!currency) {
            currency = await Currency._getCurrencyFromWallet();
        }

        if (!currency) {
            try {
                currency = await Background.action("currency");
            } catch (error) {
                console.error(`Couldn't load currency${error}`);
            }
        }

        if (!currency) {
            currency = "USD"; // fallback
        }

        return currency;
    }

    static async _getCurrency() {
        Currency.storeCurrency = await Currency._getStoreCurrency();
        const currencySetting = SyncedStorage.get("override_price");
        if (currencySetting === "auto") {
            Currency.customCurrency = Currency.storeCurrency;
        } else {
            Currency.customCurrency = currencySetting;
        }
    }

    static async _getRates() {
        const toCurrencies = [Currency.storeCurrency];
        if (Currency.customCurrency !== Currency.storeCurrency) {
            toCurrencies.push(Currency.customCurrency);
        }
        Currency._rates = await Background.action("rates", toCurrencies);
    }

    // load user currency
    static init() {
        if (!Currency._promise) {
            Currency._promise = CurrencyRegistry
                .then(Currency._getCurrency)
                .then(Currency._getRates)
                .catch(e => {
                    console.error("Failed to initialize Currency");
                    console.error(e);
                });
        }

        return Currency._promise;
    }

    static then(onDone, onCatch) {
        return Currency.init().then(onDone, onCatch);
    }

    static getRate(from, to) {
        if (from === to) { return 1; }

        if (Currency._rates[from] && Currency._rates[from][to]) {
            return Currency._rates[from][to];
        }

        return null;
    }

    static getCurrencySymbolFromString(str) {
        const re = /(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|CDN\$|A\$|HK\$|NT\$|₹|SR|R |DH|CHF|CLP\$|S\/\.|COL\$|NZ\$|ARS\$|₡|₪|₸|KD|zł|QR|\$U)/;
        const match = str.match(re);
        return match ? match[0] : "";
    }

    static currencyTypeToNumber(type) {
        return CurrencyRegistry.fromType(type).id;
    }

    static currencyNumberToType(number) {
        return CurrencyRegistry.fromNumber(number).abbr;
    }
}
