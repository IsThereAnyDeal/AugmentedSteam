import {ContextType} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FHideSpamComments from "../FHideSpamComments";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";
import FAchievementLink from "./FAchievementLink";
import FReplaceCommunityHubLinks from "./FReplaceCommunityHubLinks";
import FToggleComments from "./FToggleComments";
import FPatchBlotterFunc from "./FPatchBlotterFunc";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
            FAchievementLink,
            FReplaceCommunityHubLinks,
            FToggleComments,
            FPatchBlotterFunc,
        ]);

        // Process newly added activity entries
        new MutationObserver(mutations => {
            for (const {addedNodes} of mutations) {
                this.triggerCallbacks(addedNodes[0]);
                FEarlyAccess.show(addedNodes[0].querySelectorAll(".blotter_gamepurchase_logo, .gameLogoHolder_default"));
                FHideSpamComments.handleAllCommentThreads(addedNodes[0]);
            }
        }).observe(document.querySelector("#blotter_content"), {"childList": true});
    }
}
