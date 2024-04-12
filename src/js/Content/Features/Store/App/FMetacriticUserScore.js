import {__userScore} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FMetacriticUserScore extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showmcus") || !document.querySelector("#game_area_metascore")) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.reviews || !result.reviews.metauser) {
            return false;
        }

        this._review = result.reviews.metauser;
        return true;
    }

    apply() {

        const metauserscore = this._review.score;
        if (isNaN(metauserscore)) { return; }

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
