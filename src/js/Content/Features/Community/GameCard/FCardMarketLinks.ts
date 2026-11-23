import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import Feature from "@Content/Modules/Context/Feature";
import Price from "@Content/Modules/Currency/Price";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import CardLowestPrice from "@Content/Features/Community/GameCard/Components/CardLowestPrice.svelte";
import BadgeCompletion from "@Content/Features/Community/GameCard/Components/BadgeCompletion.svelte";
import {mount} from "svelte";

export default class FCardMarketLinks extends Feature<CGameCard> {

    override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<string|null> {
        if (this.context.saleAppids.includes(this.context.appid)) {
            return null;
        }

        let badgeCompletion: BadgeCompletion;
        if (CommunityUtils.userIsOwner(this.context.user)) {
            const badgeRow = document.querySelector<HTMLElement>(".badge_row");
            if (badgeRow) {
                const target = DOMHelper.selectLastNode(badgeRow, ".badge_empty_name")?.nextElementSibling;
                if (target) {
                    badgeCompletion = mount(BadgeCompletion, {target});
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

            mount(CardLowestPrice, {
                target: node,
                props: {
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
            });
        }

        return null;
    }
}
