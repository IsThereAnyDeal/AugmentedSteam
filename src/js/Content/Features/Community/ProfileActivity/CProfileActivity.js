import {ContextType} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import {CommentHandler} from "../../../Modules/Community/CommentHandler";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";
import FAchievementLink from "./FAchievementLink";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
            FAchievementLink,
        ]);

        FEarlyAccess.show(document.querySelectorAll(".blotter_gamepurchase_logo"));

        this._registerObserver();
    }

    _registerObserver() {

        new MutationObserver(mutations => {

            CommentHandler.hideSpamComments();

            for (const {addedNodes} of mutations) {
                this.triggerCallbacks(addedNodes[0]);
                FEarlyAccess.show(addedNodes[0].querySelectorAll(".blotter_gamepurchase_logo"));
            }
        }).observe(document.querySelector("#blotter_content"), {"childList": true});
    }
}
