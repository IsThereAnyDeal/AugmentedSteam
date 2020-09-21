import {ASFeature} from "modules";

import {HTML, HTMLParser, Localization, SyncedStorage} from "core";

export class FGamesStats extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showallstats");
    }

    apply() {

        let games = HTMLParser.getVariableFromDom("rgGames", "array");

        let countTotal = games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;

        let time = 0;
        for (let game of games) {
            if (!game['hours_forever']) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += parseFloat(game['hours_forever'].replace(",",""));
        }

        let totalTime = Localization.str.hours_short.replace("__hours__", time.toFixed(1));

        HTML.beforeBegin("#mainContents",
            `<div id="esi-collection-chart-content">
                <div class="esi-collection-stat"><span class="num">${totalTime}</span>${Localization.str.coll.total_time}</div>
                <div class="esi-collection-stat"><span class="num">${countTotal}</span>${Localization.str.coll.in_collection}</div>
                <div class="esi-collection-stat"><span class="num">${countPlayed}</span>${Localization.str.coll.played}</div>
                <div class="esi-collection-stat"><span class="num">${countNeverPlayed}</span>${Localization.str.coll.never_played}</div>
            </div>`);
    }
}
