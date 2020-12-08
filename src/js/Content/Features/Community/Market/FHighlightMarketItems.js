import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {CallbackFeature, Inventory} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightMarketItems extends CallbackFeature {

    apply() {

        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("market_listing_row_link")) {
                        this.callback();
                        return;
                    }
                }
            }
        }).observe(
            document.getElementById("mainContents"),
            {"childList": true, "subtree": true},
        );

        super.apply();
    }

    checkPrerequisites() {
        return SyncedStorage.get("highlight_owned");
    }

    async callback() {

        for (const node of document.querySelectorAll(".market_listing_row_link")) {
            const m = node.href.match(/market\/listings\/753\/(.+?)(\?|$)/);
            if (!m) { continue; }

            // todo Collect hashes and query them all at once
            if (await Inventory.hasInMarketInventory(decodeURIComponent(m[1]))) {
                FHighlightsTags.highlightOwned(node.querySelector("div"));
            }
        }
    }
}
