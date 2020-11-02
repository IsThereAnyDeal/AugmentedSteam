import {ContextType, EarlyAccess} from "../../../Modules/Content";
import {CCommunityBase} from "../CCommunityBase";
import {CommentHandler} from "../../../Modules/Content/Community/CommentHandler";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
        ]);

        new MutationObserver(() => {

            // TODO Only apply on new nodes
            this.triggerCallbacks();
            EarlyAccess.showEarlyAccess();
            CommentHandler.hideSpamComments();

        }).observe(document.querySelector("#blotter_content"), {"subtree": true, "childList": true});
    }
}
