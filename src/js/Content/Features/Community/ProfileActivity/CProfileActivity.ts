import FEarlyAccess from "../../Common/FEarlyAccess";
import FHideSpamComments from "../FHideSpamComments";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";
import FAchievementLink from "./FAchievementLink";
import FReplaceCommunityHubLinks from "./FReplaceCommunityHubLinks";
import FToggleComments from "./FToggleComments";
import FPatchBlotterFunc from "./FPatchBlotterFunc";
import CCommunityBase from "@Content/Features/Community/CCommunityBase";
import ContextType from "@Content/Modules/Context/ContextType";
import ASEventHandler from "@Content/Modules/ASEventHandler";
import EarlyAccessUtils from "@Content/Modules/EarlyAccess/EarlyAccessUtils";
import SpamComments from "@Content/Modules/Community/SpamComments";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CProfileActivity extends CCommunityBase {

    public readonly onContent: ASEventHandler<HTMLElement> = new ASEventHandler<HTMLElement>();

    constructor(params: ContextParams) {

        super(params, ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
            FAchievementLink,
            FReplaceCommunityHubLinks,
            FToggleComments,
            FPatchBlotterFunc,
        ]);

        // Process newly added activity entries
        new MutationObserver(mutations => {
            for (const {addedNodes} of mutations) {
                const node = addedNodes[0];
                if (!node || !(node instanceof HTMLElement)) {
                    return;
                }
                this.onContent.dispatch(node);
                EarlyAccessUtils.show(this.language, node.querySelectorAll(".blotter_gamepurchase_logo, .gameLogoHolder_default"));
                SpamComments.handleAllCommentThreads(node);
            }
        }).observe(
            document.querySelector("#blotter_content")!,
            {"childList": true}
        );
    }
}
