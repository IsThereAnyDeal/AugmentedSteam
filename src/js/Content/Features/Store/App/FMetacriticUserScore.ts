import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
import HTML from "@Core/Html/Html";
import {__userScore} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";

export default class FMetacriticUserScore extends Feature<CApp> {

    private _review: TStorePageData['reviews']['metauser']|null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showmcus || !document.querySelector("#game_area_metascore")) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.reviews || !result.reviews.metauser) {
            return false;
        }

        this._review = result.reviews.metauser;
        return true;
    }

    override apply(): void {
        if (!this._review) {
            return;
        }

        const metauserscore = this._review.score;
        if (metauserscore === null) {
            return;
        }

        let rating;
        if (metauserscore >= 75) {
            rating = "high";
        } else if (metauserscore >= 50) {
            rating = "medium";
        } else {
            rating = "low";
        }

        HTML.afterEnd("#game_area_metascore",
            `<div id="game_area_userscore">
                <div class="score ${rating}">${metauserscore}</div>
                <div class="logo"></div>
                <div class="wordmark">
                    <div class="metacritic">${L(__userScore)}</div>
                </div>
            </div>`);
    }
}
