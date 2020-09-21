import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FGamesStats} from "community/games/FGamesStats";
import {FCommonGames} from "community/games/FCommonGames";
import {FGamelistAchievements} from "community/games/FGamelistAchievements";

export class CGamesPage extends CCommunityBase {

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
        
        this.type = ContextTypes.GAMES;
    }
}
