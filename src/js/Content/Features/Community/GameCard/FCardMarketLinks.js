import {HTML, Localization} from "../../../../modulesCore";
import {Background, CommunityUtils, CurrencyManager, DOMHelper, Feature, Price} from "../../../modulesContent";

export default class FCardMarketLinks extends Feature {

    checkPrerequisites() {
        return !this.context.saleAppids.includes(this.context.appid);
    }

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

            const cardData = this.context.isFoil
                ? data[`${cardName} (Foil)`] || data[`${cardName} (Foil Trading Card)`]
                : data[cardName] || data[`${cardName} (Trading Card)`];

            if (!cardData) { continue; }

            const {url, price = 0} = cardData;

            if (node.classList.contains("unowned")) {
                cost += price;
            }

            if (url && price) {
                const marketLink = `https://steamcommunity.com/market/listings/${url}`;
                const cardPrice = new Price(price);
                HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${Localization.str.lowest_price} ${cardPrice}</a>`);
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
