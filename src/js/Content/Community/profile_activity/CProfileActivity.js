import {ContextType, EarlyAccess} from "../../../Modules/content";
import {CCommunityBase} from "../common/CCommunityBase";
import {CommentHandler} from "../common/CommentHandler";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super([
            FHighlightFriendsActivity,
        ]);

        this.type = ContextType.PROFILE_ACTIVITY;

        new MutationObserver(() => {

            // TODO Only apply on new nodes
            this.triggerCallbacks();
            EarlyAccess.showEarlyAccess();
            CommentHandler.hideSpamComments();

        }).observe(document.querySelector("#blotter_content"), {"subtree": true, "childList": true});
    }
}
