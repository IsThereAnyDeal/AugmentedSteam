import type CGameCard from "@Content/Features/Community/GameCard/CGameCard";
import Feature from "@Content/Modules/Context/Feature";
import Price from "@Content/Modules/Currency/Price";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import DOMHelper from "@Content/Modules/DOMHelper";
import CardLowestPrice from "@Content/Features/Community/GameCard/Components/CardLowestPrice.svelte";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import BadgeCompletion from "@Content/Features/Community/GameCard/Components/BadgeCompletion.svelte";
import RequestData from "@Content/Modules/RequestData";
import {englishBadgeUrl, marketCardNames, readCardName, readCardNames} from "@Content/Features/Community/GameCard/MarketHashName";

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

        const cards = [...document.querySelectorAll(".badge_card_set_card")]
            .map(node => ({node, cardName: readCardName(node)}));
        const visibleNames = cards.map(card => card.cardName);

        /*
         * The market only knows the English card names (#2393). On a page in another language,
         * the first price request fetches the English version of this page once, and the cards
         * are matched by position because both pages list them in the same order.
         */
        let englishNames: Promise<string[]>|null = null;
        const resolveMarketName = async (index: number, cardName: string): Promise<string> => {
            if (this.context.language?.isOneOf("english")) {
                return cardName;
            }

            if (!englishNames) {
                englishNames = RequestData.getText(englishBadgeUrl(window.location.href))
                    .then(html => readCardNames(new DOMParser().parseFromString(html, "text/html")))
                    .then(names => marketCardNames(visibleNames, names))
                    .catch(e => {
                        englishNames = null; // a retry fetches again
                        throw e;
                    });
            }
            const names = await englishNames;
            return names[index] ?? cardName;
        };

        cards.forEach(({node, cardName}, index) => {
            const isUnowned = node.classList.contains("unowned");

            if (isUnowned) {
                costMap.set(cardName, null);
            }

            (new CardLowestPrice({
                target: node,
                props: {
                    // country: this.context.user.storeCountry,
                    // currency: CurrencyManager.storeCurrency,
                    appid: this.context.appid,
                    cardName,
                    marketCardName: () => resolveMarketName(index, cardName),
                    foil: this.context.isFoil,
                    onprice: (price: Price) => {
                        // badgeCompletion only exists on the user's own badge page
                        if (isUnowned && badgeCompletion) {
                            costMap.set(cardName, price);
                            badgeCompletion.update(costMap);
                        }
                    }
                }
            }));
        });
    }
}
