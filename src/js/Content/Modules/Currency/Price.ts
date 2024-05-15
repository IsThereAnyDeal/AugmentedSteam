import CurrencyManager from "./CurrencyManager";

export default class Price {

    public readonly value: number;
    private readonly currency: string;

    static parseFromString(price: string, currency: string = CurrencyManager.storeCurrency): Price|null {
        const currencyInfo = CurrencyManager.getCurrencyInfo(currency);
        const format = currencyInfo.format;

        // remove separators
        let _price = price.trim()
            .replace(format.thousand, "");

        if (format.decimal !== ".") {
            // as expected by parseFloat()
            _price = _price.replace(format.decimal, ".");
        }

        _price = _price.replace(/[^\d.]/g, "");

        const value = parseFloat(_price);
        if (Number.isNaN(value)) {
            return null;
        }

        return new Price(value, currency);
    }

    constructor(value: number = 0, currency: string = CurrencyManager.storeCurrency) {
        this.value = value;
        this.currency = currency;
    }

    inCurrency(desiredCurrency: string): Price {
        if (this.currency === desiredCurrency) {
            return this;
        }
        const rate = CurrencyManager.getRate(this.currency, desiredCurrency);
        if (rate === null) {
            throw new Error(`Could not establish conversion rate between ${this.currency} and ${desiredCurrency}`);
        }
        return new Price(this.value * rate, desiredCurrency);
    }

    formattedValue(): string {
        return this.stringify(false);
    }

    toString(): string {
        return this.stringify();
    }

    private stringify(withSymbol = true): string {
        const currencySetup = CurrencyManager.getCurrencyInfo(this.currency);
        const format = currencySetup.format;

        const sign = this.value < 0 ? "-" : "";

        const parts = Math.abs(this.value)
            .toFixed(format.places)
            .split(".");
        const s = parts[0] ?? "";
        const decimals = parts[1] ?? "";

        let groupSize = format.group ?? 3;
        const groups: string[] = [];
        let j: number;
        for (j = s.length; j > groupSize; j -= groupSize) {
            groups.unshift(s.substring(j - groupSize, j));
        }
        groups.unshift(s.substring(0, j));

        let result = [sign, groups.join(format.thousand)];
        if (format.places > 0) {
            if (!format.hidePlacesWhenZero || parseInt(decimals) > 0) {
                result.push(format.decimal);
                result.push(decimals);
            }
        }
        if (withSymbol) {
            if (format.right) {
                result.push(format.symbolFormat);
            } else {
                result.unshift(format.symbolFormat);
            }
        }
        return result.join("");
    }
}
