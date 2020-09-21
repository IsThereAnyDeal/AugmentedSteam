import {Context, ContextTypes} from "modules";

import {EarlyAccess} from "common";
import {FHighlightsTags} from "common/FHighlightsTags";
import {FAlternativeLinuxIcon} from "store/common/FAlternativeLinuxIcon";
import {FHideTrademarks} from "common/FHideTrademarks";

export class CStoreBase extends Context {

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
