import AppId from "@Core/GameId/AppId";
import type CProfileActivity from "@Content/Features/Community/ProfileActivity/CProfileActivity";
import Feature from "@Content/Modules/Context/Feature";
import type {ASEvent} from "@Content/Modules/ASEventHandler";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";

export default class FHighlightFriendsActivity extends Feature<CProfileActivity> {

    override apply(): void {
        this.callback();
        this.context.onContent.subscribe((e: ASEvent<HTMLElement>) => this.callback(e.data))
    }

    callback(parent: Document|HTMLElement = document) {

        const excluded = [
            ".blotter_gamepurchase_logo", // Images of your friends' game purchases
            "[id^='dynamiclink_']", // Dynamic links (the first 10 store links in posts are replaced with iframes and may cause errors due to race conditions)
            "[href*='/announcements/detail/']", // Announcement header links
        ].join(",");

        // Exclude game logos from highlighting too
        let nodes: HTMLAnchorElement[] = [];

        for (let link of parent.querySelectorAll<HTMLAnchorElement>(`.blotter_block :not(.gameLogo) > a[href]:not(${excluded})`)) {
            if ((AppId.fromElement(link) !== null && link.childElementCount <= 1)
                // https://github.com/IsThereAnyDeal/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header"))
            ) {
                nodes.push(link);
            }
        }

        HighlightsTagsUtils.highlightAndTag(nodes);
    }
}
