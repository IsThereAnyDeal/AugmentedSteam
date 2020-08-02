import {ASFeature} from "modules/ASFeature";

import {HTML, Localization} from "core";
import {Background, Currency, DOMHelper, Price} from "common";
import {CommunityCommon} from "community/common";

export class FCardMarketLinks extends ASFeature {

    async apply() {

        let cost = 0;

        let data;
        try {
            data = await Background.action("market.cardprices", {
                appid: this.context.appid,
                currency: Currency.storeCurrency,
            });
        } catch (err) {
            console.error("Failed to load card prices", err);
            return;
        }

        for (let node of document.querySelectorAll(".badge_card_set_card")) {
            let cardName = node
                .querySelector(".badge_card_set_text").textContent
                .replace(/&amp;/g, "&")
                .replace(/\(\d+\)/g, "").trim();
            let cardData = data[cardName] || data[cardName + " (Trading Card)"];
            if (this.context.isFoil) {
                cardData = data[cardName + " (Foil)"] || data[cardName + " (Foil Trading Card)"];
            }

            if (cardData) {
                let marketLink = `https://steamcommunity.com/market/listings/${cardData.url}`;
                let cardPrice = new Price(cardData.price);

                if (node.classList.contains("unowned")) {
                    cost += cardPrice.value;
                }

                if (marketLink && cardPrice) {
                    HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${Localization.str.lowest_price} ${cardPrice}</a>`);
                }
            }
        }

        if (cost > 0 && CommunityCommon.currentUserIsOwner()) {
            cost = new Price(cost);
            HTML.afterEnd(
                DOMHelper.selectLastNode(document, ".badge_empty_name"),
                `<div class="badge_empty_name badge_info_unlocked">${Localization.str.badge_completion_cost.replace("__cost__", cost)}</div>`);

            document.querySelector(".badge_empty_right").classList.add("esi-badge");
        }
    }
}
