import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";
import DropStats from "@Content/Features/Community/Badges/Components/DropStats.svelte";
import { mount } from "svelte";

export default class FBadgeCalculations extends Feature<CBadges> {

    override checkPrerequisites(): boolean {
        return this.context.myProfile;
    }

    override apply(): void {
        this._updateHead();
        this._addCalculations();
    }

    _updateHead() {
        const xpBlockRight = document.querySelector(".profile_xp_block_right");
        if (!xpBlockRight) {
            return;
        }

        // Move FAQ to the middle
        HTML.beforeEnd(
            document.querySelector(".profile_xp_block_mid"),
            `<div class="es_faq_cards">${xpBlockRight.innerHTML}</div>`
        );
        HTML.inner(xpBlockRight, "");
    }

    async _addCalculations(): Promise<void> {
        const target = document.querySelector(".profile_xp_block_right")!;

        (mount(DropStats, {
                    target,
                    props: {
                        multipage: this.context.hasMultiplePages,
                        getDropCounts: () => this._countDrops(),
                        getBoosterCountEligibility: () => this._getBoosterCountEligibility()
                    }
                }));
    }

    async _countDrops(): Promise<[number, number]> {
        let totalGames: number = 0;
        let totalDrops: number = 0;

        let [games, drops] = this._countDropsFromDOM(document);
        totalGames += games;
        totalDrops += drops;

        if (this.context.hasMultiplePages) {
            for await (let [dom, images_] of this.context.eachBadgePage()) {
                let [games, drops] = this._countDropsFromDOM(dom);
                totalGames += games;
                totalDrops += drops;
            }
        }
        return [totalGames, totalDrops];
    }

    _countDropsFromDOM(dom: DocumentFragment|Document): [number, number] {
        let games: number = 0;
        let drops: number = 0;

        // The selector must be more specific here to prevent matching other progress info like "x of y tasks completed"
        for (const node of dom.querySelectorAll(".badge_title_stats_drops .progress_info_bold")) {
            const count = node.textContent!.match(/\d+/);
            if (!count) { continue; }

            games++;
            drops += Number(count[0]);
        }
        return [games, drops];
    }

    async _getBoosterCountEligibility(): Promise<number> {
        try {
            const response = await RequestData.getText("https://steamcommunity.com/my/ajaxgetboostereligibility/");

            const dummyPage = HTML.toDom(response);
            return dummyPage.querySelectorAll(".booster_eligibility_game").length;
        } catch (e) {
            console.error("Failed to load booster eligibility", e);
            throw e
        }
    }
}
