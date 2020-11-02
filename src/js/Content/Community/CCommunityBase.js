import FHideTrademarks from "common/FHideTrademarks";
import {Context, ContextType} from "../../Modules/content";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
        );

        super(type, features);
    }
}
