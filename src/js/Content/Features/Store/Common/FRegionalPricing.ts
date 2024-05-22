import {__regionUnavailable} from "@Strings/_strings";
import type CSub from "@Content/Features/Store/Sub/CSub";
import Feature from "@Content/Modules/Context/Feature";
import User from "@Content/Modules/User";
import RequestData from "@Content/Modules/RequestData";
import Price from "@Content/Modules/Currency/Price";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import Settings from "@Options/Data/Settings";

interface PackageDetailsPrice {
    currency: string,
    initial: number,
    final: number,
    discount_percent: number,
    individual: number
}

interface PackageDetails {
    [K: string]: {
        success: boolean,
        data: {
            price: PackageDetailsPrice
        }
    }
}

export default class FRegionalPricing extends Feature<CSub> {

    // Store error messages to avoid duplicate console warnings
    private _errors: Set<string> = new Set();

    override checkPrerequisites(): boolean {
        const countries = Settings.regional_countries;
        return countries && countries.length > 0 && Settings.showregionalprice !== "off";
    }

    override async apply(): Promise<void> {

        const showRegionalPrice = Settings.showregionalprice;
        const countries = Settings.regional_countries;
        const localCountry = User.storeCountry.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        for (const subid of this.context.getAllSubids()) {
            const prices: {[P: string]: PackageDetailsPrice} = {};

            await Promise.all(countries.map(async country => {
                const result = await RequestData.getJson<PackageDetails>(
                    `https://store.steampowered.com/api/packagedetails/?packageids=${subid}&cc=${country}`,
                    {"credentials": "omit"}
                );

                if (!result || !result[subid]) { return; }

                const data = result[subid]!;
                if (!data.success || !data.data.price) { return; }
                prices[country] = data.data.price;
            }));

            const apiPrice = prices[User.storeCountry.toLowerCase()];

            // For paid titles that have F2P versions with their own subid (see #894)
            if (typeof apiPrice === "undefined") { continue; }

            let priceLocal;
            try {
                priceLocal = (new Price(apiPrice.final / 100, apiPrice.currency))
                    .inCurrency(CurrencyManager.customCurrency);
            } catch (e) {
                this._handleError(e);
            }

            const pricingDiv = document.createElement("div");
            pricingDiv.classList.add("es_regional_container");

            if (showRegionalPrice === "mouse") {
                HTML.afterBegin(pricingDiv, '<div class="es_regional_arrow"></div>');
            }

            for (const country of countries) {
                if (!prices[country] || !priceLocal) {
                    continue;
                }
                HTML.beforeEnd(pricingDiv, this._getCountryHTML(country, prices[country]!, priceLocal));
            }

            const node = document.querySelector(`input[name=subid][value="${subid}"]`)!
                .closest(".game_area_purchase_game_wrapper, #game_area_purchase")!
                .querySelector(".game_purchase_action")!;

            const purchaseArea = node.closest(".game_area_purchase_game")!;
            purchaseArea.classList.add("es_regional_prices");

            if (showRegionalPrice === "always") {
                node.insertAdjacentElement("beforebegin", pricingDiv);
                purchaseArea.classList.add("es_regional_always");
            } else {
                const priceNode = node.querySelector(".price, .discount_prices")!;
                priceNode.insertAdjacentElement("beforeend", pricingDiv);
                priceNode.classList.add("es_regional_onmouse");

                if (!Settings.regional_hideworld) {
                    priceNode.classList.add("es_regional_icon");
                }
            }
        }
    }

    private _getCountryHTML(country: string, apiPrice: PackageDetailsPrice, priceLocal: Price): string {
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
                let percentage = Number((((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2));

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
            html += `<span class="es-regprice__none">${L(__regionUnavailable)}</span>`;
        }

        html += "</div>";
        return html;
    }

    private _handleError(e: any, country: string|undefined=undefined): void {
        const message = country
            ? `Can't show converted price and relative price differences for country code ${country.toUpperCase()}`
            : "Can't show relative price differences to any other currencies";

        if (!this._errors.has(message)) {
            this._errors.add(message);

            console.group("Regional pricing");
            console.error(e);
            console.warn(message);
            console.groupEnd();
        }
    }
}
