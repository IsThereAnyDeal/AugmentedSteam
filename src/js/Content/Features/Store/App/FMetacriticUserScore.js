import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FMetacriticUserScore extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("showmcus") || !document.querySelector("#game_area_metascore")) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.data || !result.data.userscore) {
            return false;
        }

        this._data = result.data.userscore;
        return true;
    }

    apply() {

        const metauserscore = this._data * 10;
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
                    <div class="metacritic">${Localization.str.user_score}</div>
                </div>
            </div>`);
    }
}
