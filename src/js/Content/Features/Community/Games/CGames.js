import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FGamesStats from "./FGamesStats";
import FCommonGames from "./FCommonGames";
import FGamelistAchievements from "./FGamelistAchievements";

export class CGames extends CCommunityBase {

    constructor() {

        // Prevent errors if "Game Details" is private & only show stats on the "All Games" tab
        if (document.querySelector(".gameListRow") && window.location.search.includes("?tab=all")) {
            super(ContextType.GAMES, [
                FGamesStats,
                FCommonGames,
                FGamelistAchievements,
            ]);
        } else {
            super(ContextType.GAMES);
        }
    }
}
