import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FGamesStats from "./FGamesStats";
import FCommonGames from "./FCommonGames";
import FGamelistAchievements from "./FGamelistAchievements";

export class CGames extends CCommunityBase {

    constructor() {

        // Prevent errors if "Game Details" is private & only show stats on the "All Games" tab
        if (document.querySelector(".gameListRow") && window.location.search.includes("?tab=all")) {
            super([
                FGamesStats,
                FCommonGames,
                FGamelistAchievements,
            ]);
        } else {
            super();
        }

        this.type = ContextType.GAMES;
    }
}
