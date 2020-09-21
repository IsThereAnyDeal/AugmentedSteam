import {Feature} from "modules";
import {HTML, Localization, SyncedStorage} from "core";

export class FMetacriticUserScore extends Feature {

    async checkPrerequisites() {
        if (SyncedStorage.get("showmcus") && document.querySelector("#game_area_metascore")) {
            const result = await this.context.data;
            return result && result.data && result.data.userscore;
        }
        return false;
    }

    async apply() {
        const node = document.querySelector("#game_area_metascore");
        const metauserscore = (await this.context.data).data.userscore * 10;

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
