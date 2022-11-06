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

        const excluded = [
            ".bb_link", // User-provided links, i.e. links in announcements/comments
            "[href*='/announcements/detail/']", // Announcement header links
        ].join(",");

        const nodes = parent.querySelectorAll(`.blotter_block a[href]:not(${excluded})`);

        for (const node of nodes) {
            node.href = node.href.replace(/steamcommunity\.com\/(?:app|games)/, "store.steampowered.com/app");
        }
    }
}
