import self_ from "./FGamesStats.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CGames from "@Content/Features/Community/Games/CGames";
import Settings from "@Options/Data/Settings";

export default class FGamesStats extends Feature<CGames> {

    private games: Array<{
        playtime_forever: number
    }> = [];

    override checkPrerequisites(): boolean {
        if (!Settings.showallstats) { return false; }

        const config = document.querySelector<HTMLElement>("#gameslist_config")?.dataset.profileGameslist;
        if (!config) { return false; }

        this.games = JSON.parse(config).rgGames;
        return this.games.length > 0;
    }

    override apply(): void {

        const countTotal = this.games.length;
        let countPlayed = 0;
        let countNeverPlayed = 0;
        let time = 0;

        for (const game of this.games) {
            if (!game.playtime_forever) {
                countNeverPlayed++;
                continue;
            }

            countPlayed++;
            time += game.playtime_forever;
        }

        const target = document.querySelector('[data-featuretarget="gameslist-root"]');
        if (!target) {
            throw new Error("Node not found");
        }

        (new self_({
            target,
            anchor: target.firstElementChild ?? undefined, // Potential race condition with React
            props: {
                countTotal: String(countTotal),
                countPlayed: String(countPlayed),
                countNeverPlayed: String(countNeverPlayed),
                totalTime: String((time / 60).toFixed(1))
            }
        }));
    }
}
