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
                ...Array.from(cur.querySelectorAll("a:not(.blotter_gamepurchase_logo)"))
                    .filter(link => (GameId.getAppid(link) !== null && link.childElementCount <= 1)

                // https://github.com/tfedor/AugmentedSteam/pull/470#pullrequestreview-284928257
                && (link.childElementCount !== 1 || !link.closest(".vote_header")))
            );
            return acc;
        }, []);

        FHighlightsTags.highlightAndTag(aNodes, false);
    }
}
