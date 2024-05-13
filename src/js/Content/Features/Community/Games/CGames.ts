import {ContextType} from "../../../Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FGamesStats from "./FGamesStats";

export default class CGames extends CCommunityBase {

    constructor() {

        super(ContextType.GAMES, [
            FGamesStats,
        ]);
    }
}
