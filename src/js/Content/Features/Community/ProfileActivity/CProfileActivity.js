import {ContextType, EarlyAccess} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import {CommentHandler} from "../../../Modules/Community/CommentHandler";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";
import FAchievementLink from "./FAchievementLink";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
            FAchievementLink,
        ]);

        this._registerObserver();
    }

    _registerObserver() {

        new MutationObserver(mutations => {

            EarlyAccess.showEarlyAccess();
            CommentHandler.hideSpamComments();

            for (const mutation of mutations) {
                this.triggerCallbacks(mutation.addedNodes[0]);
            }
        }).observe(document.querySelector("#blotter_content"), {"childList": true});
    }
}
