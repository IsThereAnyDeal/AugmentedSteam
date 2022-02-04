import {SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, Inventory} from "../../../modulesContent";
import FHighlightsTags from "../../Common/FHighlightsTags";

export default class FHighlightMarketItems extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("highlight_owned");
    }

    setup() {

        new MutationObserver(() => {
            this.callback();
        }).observe(document.getElementById("searchResultsRows"), {"childList": true});

        this.callback();
    }

    async callback() {

        const hashNamesMap = new Map();

        for (const node of document.querySelectorAll(".market_listing_row")) {
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
