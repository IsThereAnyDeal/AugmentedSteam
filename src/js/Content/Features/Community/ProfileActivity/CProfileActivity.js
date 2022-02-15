import {ContextType} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import {CommentHandler} from "../../../Modules/Community/CommentHandler";
import FEarlyAccess from "../../Common/FEarlyAccess";
import FHighlightFriendsActivity from "./FHighlightFriendsActivity";
import FAchievementLink from "./FAchievementLink";
import FReplaceCommunityHubLinks from "./FReplaceCommunityHubLinks";
import FToggleComments from "./FToggleComments";
import {Page} from "../../Page";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FHighlightFriendsActivity,
            FAchievementLink,
            FReplaceCommunityHubLinks,
            FToggleComments,
        ]);

        FEarlyAccess.show(document.querySelectorAll(".blotter_gamepurchase_logo, .gameLogoHolder_default"));

        this._registerObserver();

        // Fix undefined function when clicking on the "show all x comments" button under "uploaded a screenshot" type activity
        Page.runInPageContext(() => {
            /* eslint-disable no-undef, new-cap, camelcase */
            if (typeof Blotter_ShowLargeScreenshot !== "function") {

                Blotter_ShowLargeScreenshot = function(galleryid, showComments) {
                    const gallery = g_BlotterGalleries[galleryid];
                    const ss = gallery.shots[gallery.m_screenshotActive];
                    ShowModalContent(`${ss.m_modalContentLink}&insideModal=1&showComments=${showComments}`, ss.m_modalContentLinkText, ss.m_modalContentLink, true);
                };
            }
            /* eslint-enable no-undef, new-cap, camelcase */
        });
    }

    _registerObserver() {

        new MutationObserver(mutations => {

            CommentHandler.hideSpamComments();

            for (const {addedNodes} of mutations) {
                this.triggerCallbacks(addedNodes[0]);
                FEarlyAccess.show(addedNodes[0].querySelectorAll(".blotter_gamepurchase_logo, .gameLogoHolder_default"));
            }
        }).observe(document.querySelector("#blotter_content"), {"childList": true});
    }
}
