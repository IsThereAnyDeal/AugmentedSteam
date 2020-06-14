import { storeCheck } from "../../store.js";
import { EarlyAccess } from "../../common.js";
import { ASContext } from "../../ASContext.js";
import { FHighlightsTags } from "../../common/FHighlightsTags.js";
import { FAlternativeLinuxIcon } from "./FAlternativeLinuxIcon.js";
import { FHideTrademarks } from "../../common/FHideTrademarks.js";

export class CStoreBase extends ASContext {

    constructor(features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
            FHideTrademarks,
        );

        super(features);

        this._observeChanges();
    }

    async applyFeatures() {
        let res;

        try {
            res = await storeCheck();
        } catch(err) {
            console.group("Augmented Steam initialization")
            console.error("Failed to initiliaze Augmented Steam");
            console.error(err);
            console.groupEnd();

            return;
        }

        if (!res) { return; }

        super.applyFeatures();
    }

    _observeChanges() {

        let tabAreaNodes = document.querySelectorAll(".tag_browse_ctn, .tabarea, .browse_ctn_background");
        if (!tabAreaNodes) { return; }

        let observer = new MutationObserver(() => {
            FHighlightsTags.highlightAndTag();
            EarlyAccess.showEarlyAccess();
        });

        tabAreaNodes.forEach(tabAreaNode => observer.observe(tabAreaNode, {childList: true, subtree: true}));
    }
}
