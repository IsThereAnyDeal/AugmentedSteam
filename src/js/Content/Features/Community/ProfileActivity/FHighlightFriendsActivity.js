import AppId from "@Core/GameId/AppId";
import {CallbackFeature} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightFriendsActivity extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback(parent = document) {

        const excluded = [
            ".blotter_gamepurchase_logo", // Images of your friends' game purchases
            "[id^='dynamiclink_']", // Dynamic links (the first 10 store links in posts are replaced with iframes and may cause errors due to race conditions)
            "[href*='/announcements/detail/']", // Announcement header links
        ].join(",");

        // Exclude game logos from highlighting too
        const nodes = Array.from(parent.querySelectorAll(`.blotter_block :not(.gameLogo) > a[href]:not(${excluded})`))
            .filter(link => (AppId.fromElement(link) !== null && link.childElementCount <= 1)

                // https://github.com/IsThereAnyDeal/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header")));

        FHighlightsTags.highlightAndTag(nodes);
    }
}
