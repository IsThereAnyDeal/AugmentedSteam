import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";
import {CallbackFeature, Inventory} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightMarketItems extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("highlight_owned");
    }

    setup() {

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

        this.callback();
    }

    async callback() {

        const hashNamesMap = new Map();

        for (const node of document.querySelectorAll(".market_listing_row[data-appid]")) {
            if (node.dataset.appid === "753") {
                hashNamesMap.set(node.dataset.hashName, node);
            }
        }

        if (hashNamesMap.size === 0) { return; }

        const hashNames = Array.from(hashNamesMap.keys());
        const ownedStatus = await Inventory.hasInMarketInventory(hashNames);

        for (const hashName of hashNames) {
            if (ownedStatus[hashName]) {
                FHighlightsTags.highlightOwned(hashNamesMap.get(hashName));
            }
        }
    }
}
