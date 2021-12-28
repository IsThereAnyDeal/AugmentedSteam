import {GameId} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightFriendsActivity extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback(parent = document) {

        const aNodes = Array.from(parent.querySelectorAll(".blotter_block")).reduce((acc, cur) => {
            acc.push(
                // Don't highlight images of your friends' game purchases and don't highlight dynamic links as they will get replaced by https://github.com/SteamDatabase/SteamTracking/blob/3552ed4337cd76a5cf0c08ff4d4569d94ef6d4be/steamcommunity.com/public/shared/javascript/shared_global.js#L1512
                ...Array.from(cur.querySelectorAll("a:not(.blotter_gamepurchase_logo):not([id^='dynamiclink_'])"))
                    .filter(link => (GameId.getAppid(link) !== null && link.childElementCount <= 1)

                // https://github.com/IsThereAnyDeal/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header")))
            );
            return acc;
        }, []);

        FHighlightsTags.highlightAndTag(aNodes, false);
    }
}
