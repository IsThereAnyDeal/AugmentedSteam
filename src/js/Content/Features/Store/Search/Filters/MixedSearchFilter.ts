import SimpleSearchFilter from "./SimpleSearchFilter";
import {__searchFilters_hideMixed} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class MixedSearchFilter extends SimpleSearchFilter {

    constructor(feature: FSearchFilters) {
        super("as-hide", feature, L(__searchFilters_hideMixed), "mixed");
    }

    override _addRowMetadata(rows: NodeListOf<HTMLElement>): void {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.mixed")) {
                row.classList.add("as-hide-mixed");
            }
        }
    }
}
