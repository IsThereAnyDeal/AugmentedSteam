import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FGamesStats from "./FGamesStats";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CGames extends CCommunityBase {

    constructor(params: ContextParams) {

        super(params, ContextType.GAMES, [
            FGamesStats,
        ]);
    }
}
