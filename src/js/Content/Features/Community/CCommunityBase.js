import {Context, ContextType} from "../../modulesContent";
import FHideTrademarks from "../Common/FHideTrademarks";
import FBackToTop from "../Common/FBackToTop";
import FDisableLinkFilter from "../Common/FDisableLinkFilter";
import FKeepSSACheckboxState from "../Common/FKeepSSACheckboxState";
import FConfirmDeleteComment from "./FConfirmDeleteComment";
import FHideSpamComments from "./FHideSpamComments";
import FFavoriteEmoticons from "./FFavoriteEmoticons";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FHideTrademarks,
            FBackToTop,
            FDisableLinkFilter,
            FKeepSSACheckboxState,
            FConfirmDeleteComment,
            FHideSpamComments,
            FFavoriteEmoticons,
        );

        super(type, features);
    }
}
