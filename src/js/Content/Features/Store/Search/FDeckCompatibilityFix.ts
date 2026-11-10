import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";

/**
 * Fixing Steam bug where Steam deck compatibility box wasn't collapsable
 */
export default class FDeckCompatibilityFix extends Feature<CSearch> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<null> {
        const deckCompatibility = document.querySelector("#deck_compatibility_search_filter");
        if (deckCompatibility && !deckCompatibility.classList.contains("search_collapse_block")) {
            deckCompatibility.classList.add("search_collapse_block");
            DOMHelper.insertScript("scriptlets/Store/Search/addCollapseHandlers.js", {
                collapseName: "deck_compatibility",
                shouldCollapse: true
            });
        }
        return null;
    }
}
