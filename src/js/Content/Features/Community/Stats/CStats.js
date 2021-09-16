import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";
import FExpandAchievementDesc from "./FExpandAchievementDesc";

export class CStats extends CCommunityBase {

    constructor() {

        super(ContextType.COMMUNITY_STATS, [
            FAchievementSort,
            FExpandAchievementDesc,
        ]);
    }
}
