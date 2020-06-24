import {ASContext, ContextTypes} from "../../ASContext.js";

import {EarlyAccess} from "../../common.js";
import {FHighlightsTags} from "../../common/FHighlightsTags.js";
import {FAlternativeLinuxIcon} from "./FAlternativeLinuxIcon.js";
import {FHideTrademarks} from "../../common/FHideTrademarks.js";

export class CStoreBase extends ASContext {

    constructor(features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
            FHideTrademarks,
        );

        super(features);

        this.type = ContextTypes.STORE_DEFAULT;

        this._observeChanges();
    }

    _observeChanges() {

        const tabAreaNodes = document.querySelectorAll(".tag_browse_ctn, .tabarea, .browse_ctn_background");
        if (!tabAreaNodes) { return; }

        const observer = new MutationObserver(() => {
            FHighlightsTags.highlightAndTag();
            EarlyAccess.showEarlyAccess();
        });

        tabAreaNodes.forEach(tabAreaNode => observer.observe(tabAreaNode, {"childList": true, "subtree": true}));
    }
}
