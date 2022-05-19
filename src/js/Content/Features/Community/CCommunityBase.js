import {Context, ContextType} from "../../modulesContent";
import FHideTrademarks from "../Common/FHideTrademarks";
import FConfirmDeleteComment from "./FConfirmDeleteComment";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
            FConfirmDeleteComment,
        );

        super(type, features);
    }
}
