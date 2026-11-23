import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Facades/SteamFacade";
import type {TReactQueryData} from "@Content/Features/_types";
import {bootstrapReact, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FGamesStats from "@Content/Features/Community/Games/FGamesStats";

export interface TGame {
    playtime_forever: number
}

export default class CGames extends Context {

    public readonly games: TGame[];

    constructor(params: ContextParams, queryData: TReactQueryData) {
        super(params);

        let games: TGame[] = [];
        for (const query of queryData.queries) {
            if (query.queryKey[0] === "OwnedGames") {
                games = query.state.data;
            }
        }
        this.games = games;
    }
}


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/games
 * @match *://steamcommunity.com/(id|profiles)/*\/followedgames
 */
export async function run(): Promise<void> {
    const params = await bootstrapReact();

    const queryData: TReactQueryData = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));
    const context = new CGames(params, queryData);

    await features(context, [
        ...commonFeatures(),
        FGamesStats
    ]);
}
