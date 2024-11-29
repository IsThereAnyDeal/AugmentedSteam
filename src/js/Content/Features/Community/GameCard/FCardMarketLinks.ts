import {__badgeCompletionCost, __lowestPrice} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import Feature from "@Content/Modules/Context/Feature";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import Price from "@Content/Modules/Currency/Price";
import HTML from "@Core/Html/Html";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FCardMarketLinks extends Feature<CGameCard> {

    override checkPrerequisites(): boolean {
        return !this.context.saleAppids.includes(this.context.appid);
    }

    override async apply(): Promise<void> {

        let cost = 0;

        let data;
        try {
            data = await AugmentedSteamApiFacade.fetchMarketCardPrices(
                CurrencyManager.storeCurrency,
                this.context.appid
            );
        } catch (err) {
            console.error("Failed to load card prices", err);
            return;
        }

        for (const node of document.querySelectorAll(".badge_card_set_card")) {
            const cardName = node
                .querySelector<HTMLElement>(".badge_card_set_text")!.textContent!
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
                HTML.beforeEnd(node, `<a class="es_card_search" href="${marketLink}">${L(__lowestPrice)} ${cardPrice}</a>`);
            }
        }

        if (cost > 0 && CommunityUtils.userIsOwner(this.context.user)) {
            const badgeRow = document.querySelector<HTMLElement>(".badge_row");
            if (badgeRow) {
                HTML.afterEnd(
                    DOMHelper.selectLastNode(badgeRow, ".badge_empty_name"),
                    `<div class="badge_info_unlocked">${L(__badgeCompletionCost, {"cost": (new Price(cost)).toString()})}</div>`
                );

                badgeRow.classList.add("esi-badge");
            }
        }
    }
}
