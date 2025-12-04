import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FGamesStats from "./FGamesStats";
import type {ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import type {TReactQueryData} from "@Content/Features/_types";

export interface TGame {
    playtime_forever: number
}

export default class CGames extends CCommunityBase {

    public readonly games: TGame[];

    static override async create(params: ContextParams): Promise<CGames> {
        const queryData: TReactQueryData = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

        let games: TGame[] = [];
        for (const query of queryData.queries) {
            if (query.queryKey[0] === "OwnedGames") {
                games = query.state.data
            }
        }

        return new CGames(params, games);
    }

    constructor(params: ContextParams, games: TGame[]) {
        super(params, ContextType.GAMES, [
            FGamesStats,
        ]);

        this.games = games;
    }
}
