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
            const f = window.SteamFacade;

            if (typeof f.global("Blotter_ShowLargeScreenshot") !== "function") {

                f.globalSet("Blotter_ShowLargeScreenshot", (galleryid, showComments) => {
                    const gallery = f.global("g_BlotterGalleries")[galleryid];
                    const ss = gallery.shots[gallery.m_screenshotActive];
                    f.showModalContent(`${ss.m_modalContentLink}&insideModal=1&showComments=${showComments}`, ss.m_modalContentLinkText, ss.m_modalContentLink, true);
                });
            }
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
