import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";
import FSearchHighlights from "@Content/Features/Store/Search/FSearchHighlights";
import FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class CSearch extends Context {

    public readonly infiniScrollEnabled: boolean;

    constructor(params: ContextParams) {
        super(params);

        this.infiniScrollEnabled = document.querySelector<HTMLElement>(".search_pagination")?.style.display === "none";

        DOMHelper.insertScript("scriptlets/Store/Search/executeSearchOverride.js");

        /**
         * Fixing Steam bug where Steam deck compatibility box wasn't collapsable
         */
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


/**
 * @contentScript
 * @match *://*.steampowered.com/search[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CSearch(params);

    await features(context, [
        ...commonFeatures(),
        ...storeFeatures(),
        FSearchHighlights,
        FSearchFilters,
        // FIFeelLucky
    ]);
}