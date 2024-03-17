import {ContextType} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FShowHiddenAchievements from "./FShowHiddenAchievements";

export class CProfileStats extends CCommunityBase {

    constructor() {

        // Don't apply features if there's an error message (e.g. user doesn't own the game)
        if (document.querySelector(".profile_fatalerror") !== null) {
            super(ContextType.PROFILE_STATS);
            return;
        }

        super(ContextType.PROFILE_STATS, [
            FAchievementSort,
            FShowHiddenAchievements,
        ]);
    }
}
