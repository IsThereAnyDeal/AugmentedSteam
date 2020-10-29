import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../common/CCommunityBase";
import FShowGemsCost from "./FShowGemsCost";

export class CBoosterCreator extends CCommunityBase {

    constructor() {

        super(ContextType.BOOSTER_CREATOR, [
            FShowGemsCost,
        ]);
    }
}
