import {GameId} from "../../../../modulesCore";
import {ContextType, EarlyAccess} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import {CommentHandler} from "../../../Modules/Community/CommentHandler";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FAchievementComparisonLink from "./FAchievementComparisonLink";

export class CProfileActivity extends CCommunityBase {

    constructor() {

        super(ContextType.PROFILE_ACTIVITY, [
            FAchievementComparisonLink,
        ]);
    }

    async applyFeatures() {

        await super.applyFeatures();

        const nodes = this._getNodesToHighlight();
        await FHighlightsTags.highlightAndTag(nodes, false);

        this.triggerCallbacks(nodes); // FAchievementComparisonLink needs to wait on highlighting to check for applicable links
        this._registerObserver();
    }

    _getNodesToHighlight(parent = document) {

        const blotterBlocks = parent.querySelectorAll(".blotter_block");

        return Array.from(blotterBlocks).reduce((acc, cur) => {
            acc.push(
                ...Array.from(cur.querySelectorAll("a:not(.blotter_gamepurchase_logo)"))
                    .filter(link => (GameId.getAppid(link) && link.childElementCount <= 1)

                // https://github.com/tfedor/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header")))
            );
            return acc;
        }, []);
    }

    _registerObserver() {

        new MutationObserver(async mutations => {

            EarlyAccess.showEarlyAccess();
            CommentHandler.hideSpamComments();

            for (const mutation of mutations) {

                const nodes = this._getNodesToHighlight(mutation.addedNodes[0]);
                await FHighlightsTags.highlightAndTag(nodes, false);

                this.triggerCallbacks(nodes);
            }
        }).observe(document.querySelector("#blotter_content"), {"childList": true});
    }
}
