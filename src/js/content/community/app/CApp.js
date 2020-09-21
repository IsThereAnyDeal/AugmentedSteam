import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {GameId} from "core";
import FHighlightsTags from "common/FHighlightsTags";

import FCommunityAppPageLinks from "./FCommunityAppPageLinks";
import FCommunityAppPageWishlist from "./FCommunityAppPageWishlist";
import FSkipAgecheck from "common/FSkipAgecheck";

export class CApp extends CCommunityBase {

    constructor(features = []) {

        features.push(
            FCommunityAppPageLinks,
            FCommunityAppPageWishlist,
            FSkipAgecheck,
        );

        super(features);

        this.type = ContextTypes.COMMUNITY_APP;

        this.appid = GameId.getAppid(window.location.href);

        FHighlightsTags.highlightTitle(this.appid);

        const node = document.querySelector(".apphub_background");
        if (node) {
            new MutationObserver(() => {
                this.triggerCallbacks();
            }).observe(node, {"attributes": true}); // display changes to none if age gate is shown
        }
    }
}
