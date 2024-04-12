import {
    __coll_inCollection,
    __coll_neverPlayed,
    __coll_played,
    __coll_totalTime,
    __hoursShort,
} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML, SyncedStorage} from "../../../../modulesCore";
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

        const totalTime = L(__hoursShort, {"hours": (time / 60).toFixed(1)});

        HTML.beforeBegin("#application_root",
            `<div id="esi-games-stats-content">
                <div class="esi-stat"><span>${totalTime}</span>${L(__coll_totalTime)}</div>
                <div class="esi-stat"><span>${countTotal}</span>${L(__coll_inCollection)}</div>
                <div class="esi-stat"><span>${countPlayed}</span>${L(__coll_played)}</div>
                <div class="esi-stat"><span>${countNeverPlayed}</span>${L(__coll_neverPlayed)}</div>
            </div>`);
    }
}
