import { ASFeature } from "../../ASFeature.js";
import { HTML, SyncedStorage } from "../../../core.js";
import { Currency, Price, RequestData, User } from "../../common.js";
import { CAppPage } from "../app/CAppPage.js";
import { CSalePage } from "../sale/CSalePage.js";
import { Localization } from "../../../language.js";

export class FRegionalPricing extends ASFeature {

    checkPrerequisites() {
        let countries = SyncedStorage.get("regional_countries");
        return countries && countries.length > 0 && SyncedStorage.get("showregionalprice") !== "off"
    }

    async apply() {
        let type = "unknown";
        let showRegionalPrice = SyncedStorage.get("showregionalprice");
        let countries = SyncedStorage.get("regional_countries");
        let localCountry = User.country.toLowerCase();

        if (!countries.includes(localCountry)) {
            countries.push(localCountry);
        }

        // TODO Replace with less expensive check
        if (this.context instanceof CAppPage) {
            type = "app";
        } else if (this.context instanceof CSalePage) {
            type = "sale";
        }

        for (let subid of this.context.getAllSubids()) {

            let prices = {};

            await Promise.all(countries.map(async country => {
                let result = await RequestData.getJson(`https://store.steampowered.com/api/packagedetails/?packageids=${subid}&cc=${country}`);

                if (!result || !result[subid] || !result[subid].success || !result[subid].data.price) { return; }
                prices[country] = result[subid].data.price;
            }));

            let node = document.querySelector(`input[name=subid][value="${subid}"]`)
                .closest(".game_area_purchase_game_wrapper,#game_area_purchase,.sale_page_purchase_item")
                .querySelector(".game_purchase_action");

            let apiPrice = prices[User.country.toLowerCase()];
            let priceLocal;
            try {
                priceLocal = new Price(apiPrice.final / 100, apiPrice.currency).inCurrency(Currency.customCurrency);
            } catch(err) {
                console.group("Regional pricing");
                console.error(err);
                console.warn("Can't show relative price differences to any other currencies");
                console.groupEnd();
            }

            let pricingDiv = document.createElement("div");
            pricingDiv.classList.add("es_regional_container");
            pricingDiv.classList.add(`es_regional_${type}`);

            if (showRegionalPrice === "mouse") {
                HTML.afterBegin(pricingDiv, '<div class="es_regional_arrow"></div>');
            }

            for (let country of countries) {
                let apiPrice = prices[country];
                let html = "";

                if (apiPrice) {
                    let priceRegion = new Price(apiPrice.final / 100, apiPrice.currency);
                    let priceUser;
                    try {
                        priceUser = priceRegion.inCurrency(Currency.customCurrency);
                    } catch(err) {
                        console.group("Regional pricing");
                        console.error(err);
                        console.warn(`Not able to show converted price and relative price differences for country code "%s"`, country.toUpperCase());
                        console.groupEnd();
                    }

                    html = `<div class="es-regprice es-flag es-flag--${country}">${priceRegion}`;

                    if (priceLocal && priceUser) {
                        let percentageIndicator = "equal";
                        let percentage = (((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2);

                        if (percentage < 0) {
                            percentage = Math.abs(percentage);
                            percentageIndicator = "lower";
                        } else if (percentage > 0) {
                            percentageIndicator = "higher";
                        }

                        html +=
                            `<span class="es-regprice__converted">${priceUser}</span>
                            <span class="es-regprice__perc es-regprice__perc--${percentageIndicator}">${percentage}%</span>`;
                    }

                    html += "</div>";
                } else {
                    html =
                        `<div class="es-regprice es-flag es-flag--${country}">
                            <span class="es-regprice__none">${Localization.str.region_unavailable}</span>
                        </div>`;
                }

                HTML.beforeEnd(pricingDiv, html);
            }

            let purchaseArea = node.closest(".game_area_purchase_game,.sale_page_purchase_item");
            purchaseArea.classList.add("es_regional_prices");

            if (showRegionalPrice === "always") {
                node.insertAdjacentElement("beforebegin", pricingDiv);
                purchaseArea.classList.add("es_regional_always");
            } else {
                let priceNode = node.querySelector(".price,.discount_prices");
                priceNode.insertAdjacentElement("beforeend", pricingDiv);
                priceNode.classList.add("es_regional_onmouse");

                if (!SyncedStorage.get("regional_hideworld")) {
                    priceNode.classList.add("es_regional_icon");
                }
            }
        }
    }
}
