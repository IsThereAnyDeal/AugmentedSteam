import {Context, ContextType} from "../../modulesContent";
import FHideTrademarks from "../Common/FHideTrademarks";
import FEarlyAccess from "../Common/FEarlyAccess";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
            FEarlyAccess,
        );

        super(type, features);
    }
}
