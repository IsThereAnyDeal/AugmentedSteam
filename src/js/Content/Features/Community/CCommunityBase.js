import {Context, ContextType} from "../../modulesContent";
import FEarlyAccess from "../Common/FEarlyAccess";
import FHideTrademarks from "../Common/FHideTrademarks";
import FBackToTop from "../Common/FBackToTop";
import FDisableLinkFilter from "../Common/FDisableLinkFilter";
import FKeepSSACheckboxState from "../Common/FKeepSSACheckboxState";
import FDefaultCommunityTab from "../Common/FDefaultCommunityTab";
import FConfirmDeleteComment from "./FConfirmDeleteComment";
import FHideSpamComments from "./FHideSpamComments";
import FFavoriteEmoticons from "./FFavoriteEmoticons";

export class CCommunityBase extends Context {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FEarlyAccess,
            FHideTrademarks,
            FBackToTop,
            FDisableLinkFilter,
            FKeepSSACheckboxState,
            FDefaultCommunityTab,
            FConfirmDeleteComment,
            FHideSpamComments,
            FFavoriteEmoticons,
        );

        super(type, features);
    }
}
