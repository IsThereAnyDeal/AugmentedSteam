import self_ from "@Content/Features/Community/Badges/FBadgeCalculations.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CBadges from "@Content/Features/Community/Badges/CBadges";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/Data/RequestData";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FBadgeCalculations extends Feature<CBadges> {

    override async isEnabled(): Promise<boolean> {
        return this.context.myProfile;
    }

    override async apply(): Promise<string|null> {
        const target = document.querySelector(".profile_xp_block");
        if (!target) {
            throw new MountTargetError();
        }

        mount(self_, {
            target,
            props: {
                multipage: this.context.hasUnloadedPages,
                getDropCounts: () => this.#countDrops(),
                getBoosterCountEligibility: () => this.#getBoosterCountEligibility()
            }
        });
        return null;
    }

    async #countDrops(): Promise<[number, number]> {
        let totalGames: number = 0;
        let totalDrops: number = 0;

        let [games, drops] = this.#countDropsFromDOM(document);
        totalGames += games;
        totalDrops += drops;

        if (this.context.hasUnloadedPages) {
            for await (const dom of this.context.eachBadgePage()) {
                const [games, drops] = this.#countDropsFromDOM(dom);
                totalGames += games;
                totalDrops += drops;
            }
        }
        return [totalGames, totalDrops];
    }

    #countDropsFromDOM(dom: DocumentFragment|Document): [number, number] {
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

    async #getBoosterCountEligibility(): Promise<number> {
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
