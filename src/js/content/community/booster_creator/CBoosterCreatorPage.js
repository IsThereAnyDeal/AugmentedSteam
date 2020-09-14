import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules/ASContext";

import {FShowGemsCost} from "./FShowGemsCost";

export class CBoosterCreatorPage extends CCommunityBase {

    constructor() {

        super([
            FShowGemsCost,
        ]);

        this.type = ContextTypes.BOOSTER_CREATOR;
    }
}
