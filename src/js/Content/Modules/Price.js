import {CurrencyManager} from "./CurrencyManager";

class Price {

    constructor(value = 0, currency = CurrencyManager.storeCurrency) {
        this.value = value;
        this.currency = currency;
        Object.freeze(this);
    }

    formattedValue() {
        return CurrencyManager.fromType(this.currency).stringify(this.value, false);
    }

    toString() {
        return CurrencyManager.fromType(this.currency).stringify(this.value);
    }

    /*
     * Not currently in use
     * totalValue = totalValue.add(somePrice)
     */
    add(otherPrice) {
        let _otherPrice = otherPrice;
        if (otherPrice.currency !== this.currency) {
            _otherPrice = otherPrice.inCurrency(this.currency);
        }
        return new Price(this.value + _otherPrice.value, this.currency);
    }

    inCurrency(desiredCurrency) {
        if (this.currency === desiredCurrency) {
            return new Price(this.value, this.currency);
        }
        const rate = CurrencyManager.getRate(this.currency, desiredCurrency);
        if (rate === null) {
            throw new Error(`Could not establish conversion rate between ${this.currency} and ${desiredCurrency}`);
        }
        return new Price(this.value * rate, desiredCurrency);
    }

    static parseFromString(str, currencyType = CurrencyManager.storeCurrency) {
        const currency = CurrencyManager.fromType(currencyType);
        let value = currency.valueOf(str);
        if (value !== null) {
            value = new Price(value, currencyType);
        }
        return value;
    }
}

export {Price};
