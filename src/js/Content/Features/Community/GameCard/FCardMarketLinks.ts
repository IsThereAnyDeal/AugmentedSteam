import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import Feature from "@Content/Modules/Context/Feature";
import Price from "@Content/Modules/Currency/Price";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOMHelper";
import CardLowestPrice from "@Content/Features/Community/GameCard/Components/CardLowestPrice.svelte";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import BadgeCompletion from "@Content/Features/Community/GameCard/Components/BadgeCompletion.svelte";

export default class FCardMarketLinks extends Feature<CGameCard> {

    override checkPrerequisites(): boolean {
        return !this.context.saleAppids.includes(this.context.appid);
    }

    override async apply(): Promise<void> {

        let badgeCompletion: BadgeCompletion;
        if (CommunityUtils.userIsOwner(this.context.user)) {
            const badgeRow = document.querySelector<HTMLElement>(".badge_row");
            if (badgeRow) {
                const target = DOMHelper.selectLastNode(badgeRow, ".badge_empty_name")?.nextElementSibling;
                if (target) {
                    badgeCompletion = new BadgeCompletion({target});
                }

                badgeRow.classList.add("esi-badge");
            }
        }

        const costMap = new Map<string, Price|null>();

        for (const node of document.querySelectorAll(".badge_card_set_card")) {
            let cardName = node
                .querySelector<HTMLElement>(".badge_card_set_text")!.textContent!
                .replace(/&amp;/g, "&")
                .replace(/\(\d+\)/g, "")
                .trim();

            const isUnowned = node.classList.contains("unowned");

            if (isUnowned) {
                costMap.set(cardName, null);
            }

            (new CardLowestPrice({
                target: node,
                props: {
                    country: this.context.user.storeCountry,
                    currency: CurrencyManager.storeCurrency,
                    appid: this.context.appid,
                    cardName,
                    foil: this.context.isFoil,
                    onprice: (price: Price) => {
                        if (isUnowned) {
                            costMap.set(cardName, price);
                            badgeCompletion.update(costMap);
                        }
                    }
                }
            }));
        }
    }
}
