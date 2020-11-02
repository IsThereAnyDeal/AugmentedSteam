import {Context, ContextType, EarlyAccess} from "../../../Modules/Content";
import FHighlightsTags from "../../Common/FHighlightsTags";
import FHideTrademarks from "../../Common/FHideTrademarks";
import FAlternativeLinuxIcon from "./FAlternativeLinuxIcon";

export class CStoreBase extends Context {

    constructor(type = ContextType.STORE_DEFAULT, features = []) {

        // TODO Split this up into the relevant contexts
        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
            FHideTrademarks,
        );

        super(type, features);

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
