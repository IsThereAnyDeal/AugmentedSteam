import self_ from "./FGamesStats.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CGames from "@Content/Features/Community/Games/CGames";
import Settings from "@Options/Data/Settings";

export default class FGamesStats extends Feature<CGames> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.showallstats
            && this.context.games.length > 0;
    }

    override async apply(): Promise<void> {
        const countTotal = this.context.games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;
        let time = 0;

        for (const game of this.context.games) {
            if (!game.playtime_forever) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += game.playtime_forever;
        }

        const anchor = document.querySelector('#tabs_baseline')?.nextElementSibling;
        if (!anchor) {
            throw new Error("[FGamesStats] Node not found");
        }

        (new self_({
            target: anchor.parentElement!,
            anchor,
            props: {
                countTotal: String(countTotal),
                countPlayed: String(countPlayed),
                countNeverPlayed: String(countNeverPlayed),
                totalTime: String((time / 60).toFixed(1))
            }
        }));
    }
}
