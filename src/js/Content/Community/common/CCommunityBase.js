import FHideTrademarks from "common/FHideTrademarks";
import {Context, ContextType} from "../../../Modules/content";

export class CCommunityBase extends Context {

    constructor(features = []) {

        features.push(
            FHideTrademarks,
        );

        super(ContextType.COMMUNITY_DEFAULT, features);
    }
}
