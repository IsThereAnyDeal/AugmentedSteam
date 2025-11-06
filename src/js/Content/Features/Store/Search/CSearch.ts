import FSearchFilters from "./FSearchFilters";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import ContextType from "@Content/Modules/Context/ContextType";
import type {ContextParams} from "@Content/Modules/Context/Context";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class CSearch extends CStoreBase {

    public readonly infiniScrollEnabled: boolean;

    constructor(params: ContextParams) {
        super(params, ContextType.SEARCH, [
            FSearchFilters,
        ]);

        this.infiniScrollEnabled = document.querySelector<HTMLElement>(".search_pagination")?.style.display === "none";

        /**
         * Fixing Steam bug where Steam deck compatibility box wasn't collapsable
         * */
        const deckCompatibility = document.querySelector("#deck_compatibility_search_filter");
        if (deckCompatibility && !deckCompatibility.classList.contains("search_collapse_block")) {
            deckCompatibility.classList.add("search_collapse_block");
            DOMHelper.insertScript("scriptlets/Store/Search/addCollapseHandlers.js", {
                collapseName: "deck_compatibility",
                shouldCollapse: true
            });
        }
    }
}
