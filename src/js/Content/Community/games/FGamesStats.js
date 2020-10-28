import {Feature} from "../../../Modules/Content/Feature/Feature";
import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../core_modules";

export default class FGamesStats extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showallstats");
    }

    apply() {

        const games = HTMLParser.getVariableFromDom("rgGames", "array");

        const countTotal = games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;

        let time = 0;
        for (const game of games) {
            if (!game.hours_forever) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += parseFloat(game.hours_forever.replace(",", ""));
        }

        const totalTime = Localization.str.hours_short.replace("__hours__", time.toFixed(1));

        HTML.beforeBegin("#mainContents",
            `<div id="esi-collection-chart-content">
                <div class="esi-collection-stat"><span class="num">${totalTime}</span>${Localization.str.coll.total_time}</div>
                <div class="esi-collection-stat"><span class="num">${countTotal}</span>${Localization.str.coll.in_collection}</div>
                <div class="esi-collection-stat"><span class="num">${countPlayed}</span>${Localization.str.coll.played}</div>
                <div class="esi-collection-stat"><span class="num">${countNeverPlayed}</span>${Localization.str.coll.never_played}</div>
            </div>`);
    }
}
