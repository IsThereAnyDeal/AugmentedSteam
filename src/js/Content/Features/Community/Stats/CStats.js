import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FAchievementSort from "./FAchievementSort";

export class CStats extends CCommunityBase {

    constructor() {

        super(ContextType.COMMUNITY_STATS, [
            FAchievementSort,
        ]);
    }
}
