import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FShowHiddenAchievements from "./FShowHiddenAchievements";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CProfileStats extends CCommunityBase {

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. user doesn't own the game)
        if (document.querySelector(".profile_fatalerror") !== null) {
            super(params, ContextType.PROFILE_STATS);
            return;
        }

        super(params, ContextType.PROFILE_STATS, [
            FAchievementSort,
            FShowHiddenAchievements,
        ]);
    }
}
