import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FFixAppImageNotFound from "../FFixAppImageNotFound";
import FGamesStats from "./FGamesStats";
import FCommonGames from "./FCommonGames";
import FGamelistAchievements from "./FGamelistAchievements";

export class CGames extends CCommunityBase {

    constructor() {

        // Prevent errors if games list is empty or if "Game Details" is private
        if (!document.querySelector(".gameListRow")) {
            super(ContextType.GAMES);
            return;
        }

        super(ContextType.GAMES, [
            FFixAppImageNotFound,
            FGamesStats,
            FCommonGames,
            FGamelistAchievements,
        ]);

        this.showStats = new URLSearchParams(window.location.search).get("tab") === "all";
    }
}
