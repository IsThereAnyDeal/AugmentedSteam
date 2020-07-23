import {ASContext, ContextTypes} from "modules/ASContext";

import {FHideTrademarks} from "common/FHideTrademarks";

export class CCommunityBase extends ASContext {

    constructor(features = []) {

        features.push(
            FHideTrademarks,
        );

        super(features);

        this.type = ContextTypes.COMMUNITY_DEFAULT;
    }
}
