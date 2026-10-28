import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";
import MetacriticUserScore from "@Content/Features/Store/App/Components/ReviewScores/MetacriticUserScore.svelte";
import OpenCriticScore from "@Content/Features/Store/App/Components/ReviewScores/OpenCriticScore.svelte";
import type { TStorePageData } from "@Background/Modules/AugmentedSteam/_types";

export default class FReviewScores extends Feature<CApp> {

    #reviews: TStorePageData['reviews']|null = null

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.showmcus || Settings.showoc;
    }

    override async apply(): Promise<void> {
        this.#reviews = (await this.context.data)?.reviews ?? null;
        if (!this.#reviews) {
            return;
        }

        const metascoreNode = document.querySelector("#game_area_metascore");

        if (Settings.showoc) {
            this.#mountOpencritic(metascoreNode);
        }

        if (Settings.showmcus) {
            this.#mountMetacritic(metascoreNode);
        }
    }

    #mountOpencritic(metascoreNode: Element|null) {
        const review = this.#reviews?.opencritic;
        if (!review) {
            return;
        }

        let anchor: Element|null = metascoreNode
            ? metascoreNode.nextElementSibling
            : (document.querySelector(".game_details")?.nextElementSibling ?? null);

        if (!anchor) {
            return;
        }

        mount(OpenCriticScore, {
            target: anchor.parentElement!,
            anchor,
            props: {
                standalone: metascoreNode === null,
                score: review.score,
                award: review.verdict,
                url: review.url
            }
        });
    }

    #mountMetacritic(metascoreNode: Element|null) {
        if (!metascoreNode) {
            return;
        }

        const review = this.#reviews?.metauser;
        if (!review || !review.score) {
            return;
        }

        mount(MetacriticUserScore, {
            target: metascoreNode.parentElement!,
            anchor: metascoreNode.nextElementSibling ?? undefined,
            props: {
                score: review.score,
                url: review.url
            }
        });
    }
}
