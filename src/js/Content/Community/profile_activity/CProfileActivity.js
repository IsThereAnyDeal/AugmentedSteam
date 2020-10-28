import {CCommunityBase} from "community/common/CCommunityBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FHighlightFriendsActivity from "./FHighlightFriendsActivity";

import {EarlyAccess} from "common";
import {CommentHandler} from "community/common/CommentHandler";

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
