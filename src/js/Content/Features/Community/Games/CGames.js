import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FEarlyAccess from "../../Common/FEarlyAccess";
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
            FGamesStats,
            FCommonGames,
            FGamelistAchievements,
        ]);

        FEarlyAccess.show(document.querySelectorAll(".gameListRowLogo"));

        this.showStats = new URLSearchParams(window.location.search).get("tab") === "all";
    }
}
