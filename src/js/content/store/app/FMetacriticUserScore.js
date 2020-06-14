import { ASFeature } from "../../ASFeature.js";
import { HTML, SyncedStorage } from "../../../core.js";
import { Localization } from "../../../language.js";

export class FMetacriticUserScore extends ASFeature {

    async checkPrerequisites() {
        if (SyncedStorage.get("showmcus") && document.querySelector("#game_area_metascore")) {
            let result = await this.context.data;
            return result && result.data && result.data.userscore;
        }
        return false;
    }

    async apply() {
        let node = document.querySelector("#game_area_metascore");
        let metauserscore = (await this.context.data).data.userscore * 10;

        if (!isNaN(metauserscore)) {
            let rating;
            if (metauserscore >= 75) {
                rating = "high";
            } else if (metauserscore >= 50) {
                rating = "medium";
            } else {
                rating = "low";
            }

            HTML.afterEnd(node,
                `<div id="game_area_userscore">
                    <div class="score ${rating}">${metauserscore}</div>
                    <div class="logo"></div>
                    <div class="wordmark">
                        <div class="metacritic">${Localization.str.user_score}</div>
                    </div>
                </div>`);
        }
    }
}
