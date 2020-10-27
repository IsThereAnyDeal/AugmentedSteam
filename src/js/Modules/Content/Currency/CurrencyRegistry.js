import {StringUtils} from "../../Core/Utils/StringUtils";
import {Background} from "../../../Content/common";

export class CurrencyRegistry {

    static fromType(type) {
        return CurrencyRegistry._indices.abbr[type] || CurrencyRegistry._defaultCurrency;
    }

    static fromNumber(number) {
        return CurrencyRegistry._indices.id[number] || CurrencyRegistry._defaultCurrency;
    }

    static async init() {

        const currencies = await Background.action("steam.currencies");

        for (let currency of currencies) {

            currency = new CurrencyRegistry.SteamCurrency(currency);
            CurrencyRegistry._indices.abbr[currency.abbr] = currency;
            CurrencyRegistry._indices.id[currency.id] = currency;

            if (currency.symbol) { // CNY && JPY use the same symbol
                CurrencyRegistry._indices.symbols[currency.symbol] = currency;
            }
        }
        CurrencyRegistry._defaultCurrency = CurrencyRegistry._indices.id[1]; // USD
    }

    static then(onDone, onCatch) {
        return CurrencyRegistry.init().then(onDone, onCatch);
    }
}

CurrencyRegistry._indices = {
    "id": {},
    "abbr": {},
    "symbols": {},
};

/*
 * Example:
 * {
 *  "id": 1,
 *  "abbr": "USD",
 *  "symbol": "$",
 *  "hint": "United States Dollars",
 *  "multiplier": 100,
 *  "unit": 1,
 *  "format": {
 *      "places": 2,
 *      "hidePlacesWhenZero": false,
 *      "symbolFormat": "$",
 *      "thousand": ",",
 *      "decimal": ".",
 *      "right": false
 *  }
 * }
 */
CurrencyRegistry.SteamCurrency = class {

    constructor({
                    id,
                    abbr = "USD",
                    symbol = "$",
                    hint = "Default Currency",
                    multiplier = 100,
                    unit = 1,
                    "format": {
                        "places": formatPlaces = 2,
                        "hidePlacesWhenZero": formatHidePlaces = false,
                        "symbolFormat": formatSymbol = "$",
                        "thousand": formatGroupSeparator = ",",
                        "group": formatGroupSize = 3,
                        "decimal": formatDecimalSeparator = ".",
                        "right": formatPostfixSymbol = false,
                    },
                }) {

        // console.assert(id && Number.isInteger(id))
        Object.assign(this, {
            "id": id, // Steam Currency ID, integer, 1-41 (at time of writing)
            "abbr": abbr, // TLA for the currency
            "symbol": symbol, // Symbol used to represent/recognize the currency, this is NULL for CNY to avoid collision with JPY
            "hint": hint, // English label for the currency to reduce mistakes editing the JSON
            "multiplier": multiplier, // multiplier used by Steam when writing values
            "unit": unit, // Minimum transactional unit required by Steam.
            "format": {
                "decimalPlaces": formatPlaces, // How many decimal places does this currency have?
                "hidePlacesWhenZero": formatHidePlaces, // Does this currency show decimal places for a .0 value?
                "symbol": formatSymbol, // Symbol used when generating a string value of this currency
                "groupSeparator": formatGroupSeparator, // Thousands separator
                "groupSize": formatGroupSize, // Digits to a "thousand" for the thousands separator
                "decimalSeparator": formatDecimalSeparator,
                "postfix": formatPostfixSymbol, // Should format.symbol be post-fixed?
            },
        });
        Object.freeze(this.format);
        Object.freeze(this);
    }

    valueOf(price) {

        // remove separators
        let _price = price.trim()
            .replace(this.format.groupSeparator, "");
        if (this.format.decimalSeparator !== ".") {
            _price = _price.replace(this.format.decimalSeparator, ".");
        } // as expected by parseFloat()
        _price = _price.replace(/[^\d.]/g, "");

        const value = parseFloat(_price);

        if (Number.isNaN(value)) { return null; }
        return value; // this.multiplier?
    }

    stringify(value, withSymbol = true) {
        const sign = value < 0 ? "-" : "";
        const _value = Math.abs(value);

        let s = _value.toFixed(this.format.decimalPlaces),
            decimals;

        [s, decimals] = s.split(".");

        const g = [];
        let j = s.length;

        for (; j > this.format.groupSize; j -= this.format.groupSize) {
            g.unshift(s.substring(j - this.format.groupSize, j));
        }
        g.unshift(s.substring(0, j));
        s = [sign, g.join(this.format.groupSeparator)];
        if (this.format.decimalPlaces > 0) {
            if (!this.format.hidePlacesWhenZero || parseInt(decimals) > 0) {
                s.push(this.format.decimalSeparator);
                s.push(decimals);
            }
        }
        if (withSymbol) {
            if (this.format.postfix) {
                s.push(this.format.symbol);
            } else {
                s.unshift(this.format.symbol);
            }
        }
        return s.join("");
    }

    placeholder() {
        let str = `1${this.format.groupSeparator}`;
        let cur = 2;
        for (let i = 0; i < this.format.groupSize; ++i, ++cur) {
            str += cur;
        }

        if (this.format.decimalPlaces === 0) {
            return str;
        }

        str += this.format.decimalSeparator;
        for (let i = 0; i < this.format.decimalPlaces; ++i, ++cur) {
            str += cur;
        }
        return str;
    }

    regExp() {
        let regex = `^(?:\\d{1,${
            this.format.groupSize
        }}(?:${
            StringUtils.escapeRegExp(this.format.groupSeparator)
        }\\d{${
            this.format.groupSize
        }})+|\\d*)`;

        if (this.format.decimalPlaces > 0) {
            regex += `(?:${StringUtils.escapeRegExp(this.format.decimalSeparator)}\\d{0,${this.format.decimalPlaces}})?`;
        }
        regex += "$";

        return new RegExp(regex);
    }
};
