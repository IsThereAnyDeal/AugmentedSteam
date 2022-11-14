import {Context, ContextType} from "../../modulesContent";
import FHideTrademarks from "../Common/FHideTrademarks";
import FBackToTop from "../Common/FBackToTop";
import FConfirmDeleteComment from "./FConfirmDeleteComment";
import FHideSpamComments from "./FHideSpamComments";
import FFavoriteEmoticons from "./FFavoriteEmoticons";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
            FBackToTop,
            FConfirmDeleteComment,
            FHideSpamComments,
            FFavoriteEmoticons,
        );

        super(type, features);
    }
}
