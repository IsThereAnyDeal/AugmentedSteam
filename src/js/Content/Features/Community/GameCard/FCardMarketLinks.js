import {HTML, Localization} from "../../../../modulesCore";
import {Background, CommunityUtils, CurrencyManager, DOMHelper, Feature, Price} from "../../../modulesContent";

export default class FCardMarketLinks extends Feature {

    async apply() {

        let cost = 0;

        let data;
        try {
            data = await Background.action("market.cardprices", {
                "appid": this.context.appid,
                "currency": CurrencyManager.storeCurrency,
            });
        } catch (err) {
            console.error("Failed to load card prices", err);
            return;
        }

        for (const node of document.querySelectorAll(".badge_card_set_card")) {
            const cardName = node
                .querySelector(".badge_card_set_text").textContent
                .replace(/&amp;/g, "&")
                .replace(/\(\d+\)/g, "")
                .trim();
            let cardData = data[cardName] || data[`${cardName} (Trading Card)`];
            if (this.context.isFoil) {
                cardData = data[`${cardName} (Foil)`] || data[`${cardName} (Foil Trading Card)`];
            }

            if (cardData) {
                const marketLink = `https://steamcommunity.com/market/listings/${cardData.url}`;
                const cardPrice = new Price(cardData.price);

                if (node.classList.contains("unowned")) {
                    cost += cardPrice.value;
                }

                if (marketLink && cardPrice) {
                    HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${Localization.str.lowest_price} ${cardPrice}</a>`);
                }
            }
        }

        if (cost > 0 && CommunityUtils.currentUserIsOwner()) {
            cost = new Price(cost);
            HTML.afterEnd(
                DOMHelper.selectLastNode(document, ".badge_empty_name"),
                `<div class="badge_empty_name badge_info_unlocked">${Localization.str.badge_completion_cost.replace("__cost__", cost)}</div>`
            );

            document.querySelector(".badge_empty_right").classList.add("esi-badge");
        }
    }
}
