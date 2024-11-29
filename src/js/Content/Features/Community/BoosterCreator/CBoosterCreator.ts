import FShowGemsCost from "./FShowGemsCost";
import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "@Content/Features/Community/CCommunityBase";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CBoosterCreator extends CCommunityBase {

    constructor(params: ContextParams) {

        super(params, ContextType.BOOSTER_CREATOR, [
            FShowGemsCost,
        ]);
    }
}
