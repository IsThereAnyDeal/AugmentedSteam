import {ExtensionResources} from "../Core/ExtensionResources";

class StaticResources {

    static async currencies() {
        const self = StaticResources;
        if (!self._supportedCurrencies || self._supportedCurrencies.length < 1) {

            /**
             * https://partner.steamgames.com/doc/store/pricing/currencies
             */
            self._supportedCurrencies = await ExtensionResources.getJSON("json/currency.json");
        }
        return self._supportedCurrencies;
    }
}
StaticResources._supportedCurrencies = null;


export {StaticResources};
