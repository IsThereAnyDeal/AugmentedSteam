import {GameId, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, DOMHelper, User} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightFriendsActivity extends CallbackFeature {

    setup() {
        this.callback();
    }

    async callback() {

        const blotterBlocks = document.querySelectorAll(".blotter_block:not(.es_highlight_checked)");
        blotterBlocks.forEach(node => node.classList.add("es_highlight_checked"));

        const aNodes = Array.from(blotterBlocks).reduce((acc, cur) => {
            acc.push(
                ...Array.from(cur.querySelectorAll("a:not(.blotter_gamepurchase_logo)"))
                    .filter(link => (GameId.getAppid(link) && link.childElementCount <= 1)

                // https://github.com/tfedor/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header")))
            );
            return acc;
        }, []);

        await FHighlightsTags.highlightAndTag(aNodes, false);

        if (!SyncedStorage.get("showcomparelinks")) { return; }

        blotterBlocks.forEach(blotter => {
            blotter.querySelectorAll("a.es_highlighted_owned").forEach(aNode => {
                this._addAchievementComparisonLink(aNode);
            });
        });
    }

    _addAchievementComparisonLink(node) {
        const blotter = node.closest(".blotter_daily_rollup_line");
        if (!blotter) { return; }

        if (node.parentNode.nextElementSibling.tagName !== "IMG") { return; }

        let friendProfileUrl = blotter.querySelector("a[data-miniprofile]").href;
        if (!friendProfileUrl.endsWith("/")) {
            friendProfileUrl += "/";
        }

        if (friendProfileUrl === User.profileUrl) { return; }

        node.classList.add("es_achievements");

        const compareLink = `${friendProfileUrl}stats/${GameId.getAppid(node)}/compare/#es-compare`;
        HTML.beforeBegin(
            DOMHelper.selectLastNode(blotter, "div"),
            `<a class="es_achievement_compare" href="${compareLink}" target="_blank">(${Localization.str.compare})</a>`
        );
    }
}
