import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FGamesStats extends Feature {

    checkPrerequisites() {
        if (!SyncedStorage.get("showallstats")) { return false; }

        const config = document.querySelector("#gameslist_config")?.dataset.profileGameslist;
        if (!config) { return false; }

        this._games = JSON.parse(config).rgGames;
        return this._games.length > 0;
    }

    apply() {

        const countTotal = this._games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;

        let time = 0;
        for (const game of this._games) {
            if (!game.playtime_forever) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += game.playtime_forever;
        }

        const totalTime = Localization.str.hours_short.replace("__hours__", (time / 60).toFixed(1));

        HTML.beforeBegin("#application_root",
            `<div id="esi-games-stats-content">
                <div class="esi-stat"><span>${totalTime}</span>${Localization.str.coll.total_time}</div>
                <div class="esi-stat"><span>${countTotal}</span>${Localization.str.coll.in_collection}</div>
                <div class="esi-stat"><span>${countPlayed}</span>${Localization.str.coll.played}</div>
                <div class="esi-stat"><span>${countNeverPlayed}</span>${Localization.str.coll.never_played}</div>
            </div>`);
    }
}
