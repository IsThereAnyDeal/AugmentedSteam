import {Context, ContextType, EarlyAccess} from "../../../Modules/content";;
import FHighlightsTags from "common/FHighlightsTags";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";
import FHideTrademarks from "common/FHideTrademarks";

export class CStoreBase extends Context {

    constructor(features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
            FHideTrademarks,
        );

        super(features);

        this.type = ContextType.STORE_DEFAULT;

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
