import {Context, ContextTypes} from "modules";

import {FHideTrademarks} from "common/FHideTrademarks";

export class CCommunityBase extends Context {

    constructor(features = []) {

        features.push(
            FHideTrademarks,
        );

        super(features);

        this.type = ContextTypes.COMMUNITY_DEFAULT;
    }
}
