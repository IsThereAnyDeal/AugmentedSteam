import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CurrencyManager, Feature, Price, RequestData, User} from "../../../modulesContent";

export default class FRegionalPricing extends Feature {

    constructor(context) {
        super(context);

        // Store error messages to avoid duplicate console warnings
        this._errors = new Set();
    }

    checkPrerequisites() {
        const countries = SyncedStorage.get("regional_countries");
        return countries && countries.length > 0 && SyncedStorage.get("showregionalprice") !== "off";
    }

    async apply() {

        const showRegionalPrice = SyncedStorage.get("showregionalprice");
        const countries = SyncedStorage.get("regional_countries");
        const localCountry = User.storeCountry.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        for (const subid of this.context.getAllSubids()) {

            const prices = {};

            await Promise.all(countries.map(async country => {
                const result = await RequestData.getJson(
                    `https://store.steampowered.com/api/packagedetails/?packageids=${subid}&cc=${country}`
                );

                if (!result || !result[subid] || !result[subid].success || !result[subid].data.price) { return; }
                prices[country] = result[subid].data.price;
            }));

            const apiPrice = prices[User.storeCountry.toLowerCase()];

            // For paid titles that have F2P versions with their own subid (see #894)
            if (typeof apiPrice === "undefined") { continue; }

            let priceLocal;
            try {
                priceLocal = new Price(apiPrice.final / 100, apiPrice.currency).inCurrency(CurrencyManager.customCurrency);
            } catch (err) {
                this._handleError(err);
            }

            const pricingDiv = document.createElement("div");
            pricingDiv.classList.add("es_regional_container");

            if (showRegionalPrice === "mouse") {
                HTML.afterBegin(pricingDiv, '<div class="es_regional_arrow"></div>');
            }

            for (const country of countries) {
                HTML.beforeEnd(pricingDiv, this._getCountryHTML(country, prices[country], priceLocal));
            }

            const node = document.querySelector(`input[name=subid][value="${subid}"]`)
                .closest(".game_area_purchase_game_wrapper, #game_area_purchase")
                .querySelector(".game_purchase_action");

            const purchaseArea = node.closest(".game_area_purchase_game");
            purchaseArea.classList.add("es_regional_prices");

            if (showRegionalPrice === "always") {
                node.insertAdjacentElement("beforebegin", pricingDiv);
                purchaseArea.classList.add("es_regional_always");
            } else {
                const priceNode = node.querySelector(".price, .discount_prices");
                priceNode.insertAdjacentElement("beforeend", pricingDiv);
                priceNode.classList.add("es_regional_onmouse");

                if (!SyncedStorage.get("regional_hideworld")) {
                    priceNode.classList.add("es_regional_icon");
                }
            }
        }
    }

    _getCountryHTML(country, apiPrice, priceLocal) {
        let html = "";

        if (apiPrice) {
            const priceRegion = new Price(apiPrice.final / 100, apiPrice.currency);
            let priceUser;
            try {
                priceUser = priceRegion.inCurrency(CurrencyManager.customCurrency);
            } catch (err) {
                this._handleError(err, country);
            }

            html += `<div class="es-regprice es-flag es-flag--${country}">${priceRegion}`;

            if (priceLocal && priceUser) {
                let percentageIndicator = "equal";
                let percentage = (((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2);

                if (percentage < 0) {
                    percentage = Math.abs(percentage);
                    percentageIndicator = "lower";
                } else if (percentage > 0) {
                    percentageIndicator = "higher";
                }

                html += `<span class="es-regprice__converted">${priceUser}</span>`;
                html += `<span class="es-regprice__perc es-regprice__perc--${percentageIndicator}">${percentage}%</span>`;
            }
        } else {
            html += `<div class="es-regprice es-flag es-flag--${country}">`;
            html += `<span class="es-regprice__none">${Localization.str.region_unavailable}</span>`;
        }

        html += "</div>";
        return html;
    }

    _handleError(err, country) {
        const message = country
            ? `Can't show converted price and relative price differences for country code ${country.toUpperCase()}`
            : "Can't show relative price differences to any other currencies";

        if (!this._errors.has(message)) {
            this._errors.add(message);

            console.group("Regional pricing");
            console.error(err);
            console.warn(message);
            console.groupEnd();
        }
    }
}
