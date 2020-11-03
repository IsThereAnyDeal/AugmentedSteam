import {Context, ContextType} from "../../modulesContent";
import FHideTrademarks from "../Common/FHideTrademarks";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
        );

        super(type, features);
    }
}
