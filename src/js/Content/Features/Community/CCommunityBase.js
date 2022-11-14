import {Context, ContextType} from "../../modulesContent";
import FEarlyAccess from "../Common/FEarlyAccess";
import FHideTrademarks from "../Common/FHideTrademarks";
import FConfirmDeleteComment from "./FConfirmDeleteComment";
import FHideSpamComments from "./FHideSpamComments";
import FFavoriteEmoticons from "./FFavoriteEmoticons";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FEarlyAccess,
            FHideTrademarks,
            FConfirmDeleteComment,
            FHideSpamComments,
            FFavoriteEmoticons,
        );

        super(type, features);
    }
}
