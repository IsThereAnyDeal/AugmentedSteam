import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";
import FShowGemsCost from "./FShowGemsCost";

export class CBoosterCreator extends CCommunityBase {

    constructor() {

        super([
            FShowGemsCost,
        ]);

        this.type = ContextType.BOOSTER_CREATOR;
    }
}
