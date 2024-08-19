import FShowGemsCost from "./FShowGemsCost";
import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "@Content/Features/Community/CCommunityBase";

export default class CBoosterCreator extends CCommunityBase {

    constructor() {

        super(ContextType.BOOSTER_CREATOR, [
            FShowGemsCost,
        ]);
    }
}
