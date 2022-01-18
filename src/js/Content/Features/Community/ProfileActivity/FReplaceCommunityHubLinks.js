import {SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class FReplaceCommunityHubLinks extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("replacecommunityhublinks");
    }

    setup() {
        this.callback();
    }

    callback(parent = document) {

        // Don't replace user-provided links i.e. links in announcements/comments
        const nodes = parent.querySelectorAll(".blotter_block a[href]:not(.bb_link)");

        for (const node of nodes) {

            // https://github.com/IsThereAnyDeal/AugmentedSteam/issues/1368
            if (node.parentElement.classList.contains("blotter_group_announcement_headline")) {
                continue;
            }

            node.href = node.href.replace(/steamcommunity\.com\/(?:app|games)/, "store.steampowered.com/app");
        }
    }
}
