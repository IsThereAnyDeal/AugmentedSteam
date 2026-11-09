import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import storeFeatures from "@Content/Features/Store/storeFeatures";
import FSearchHighlights from "@Content/Features/Store/Search/FSearchHighlights";
import FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";
import AugmentedSteamApiFacade from "@Content/Facades/AugmentedSteamApiFacade";

export default class CSearch extends Context {

    #eaChecked: Set<number> = new Set();
    #eaAppids: Set<number> = new Set();

    onMutation: Array<() => void> = [];

    constructor(params: ContextParams) {
        super(params);

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

        const searchResultsParent = document.querySelector("#search_results");
        if (!searchResultsParent) {
            console.error("Did not find search results")
        } else {
            const observer = new MutationObserver(async () => {
                await this.#handleEarlyAccess();
                for (const fn of this.onMutation) { fn(); }
            });
            observer.observe(searchResultsParent, {
                childList: true,
                subtree: true
            });
        }
    }

    async #handleEarlyAccess(): Promise<void> {
        // TODO required only when early access or search features are enabled
        let appids: number[] = [];

        const rows = document.querySelectorAll<HTMLElement>(".search_result_row[data-ds-appid]:not([data-as-checked])");
        for(const row of rows) {
            const appid = Number(row.dataset.dsAppid);
            if (!this.#eaChecked.has(appid)) {
                appids.push(appid);
            }
        }

        if (appids.length === 0) {
            return;
        }

        const response = await AugmentedSteamApiFacade.isEarlyAccess(appids);
        for (let [appid_, isEa] of Object.entries(response)) {
            const appid = Number(appid_);
            this.#eaChecked.add(appid);
            if (isEa) {
                this.#eaAppids.add(appid);
            }
        }

        for(const row of rows) {
            row.dataset.asChecked = "checked";
            const appid = Number(row.dataset.dsAppid);
            if (this.#eaAppids.has(appid)) {
                row.dataset.asEa = "1";
            }
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