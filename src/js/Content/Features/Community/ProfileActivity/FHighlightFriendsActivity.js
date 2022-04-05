import {GameId} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightFriendsActivity extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback(parent = document) {

        /**
         * Don't highlight images of your friends' game purchases and dynamic links
         * Dynamic links will get replaced by https://github.com/SteamDatabase/SteamTracking/blob/3552ed4337cd76a5cf0c08ff4d4569d94ef6d4be/steamcommunity.com/public/shared/javascript/shared_global.js#L1512
         */
        const nodes = Array.from(parent.querySelectorAll(".blotter_block a[href]:not(.blotter_gamepurchase_logo, [id^='dynamiclink_'])"))
            .filter(link => (GameId.getAppid(link) !== null && link.childElementCount <= 1)

                // https://github.com/IsThereAnyDeal/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header"))

                // https://github.com/IsThereAnyDeal/AugmentedSteam/issues/1368
                && !link.parentElement.classList.contains("blotter_group_announcement_headline")
            
                && !link.parentElement.classList.contains("gameLogo"));

        FHighlightsTags.highlightAndTag(nodes, false);
    }
}
