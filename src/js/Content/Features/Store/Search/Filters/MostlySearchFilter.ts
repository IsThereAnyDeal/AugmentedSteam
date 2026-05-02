import SimpleSearchFilter from "./SimpleSearchFilter";
import {__searchFilters_hideNegative} from "@Strings/_strings";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";
import {L} from "@Core/Localization/Localization";

export default class NegativeSearchFilter extends SimpleSearchFilter {

    constructor(feature: FSearchFilters) {
        super("as-hide", feature, L(__searchFilters_hideNegative), "negative");
    }

    override _addRowMetadata(rows: NodeListOf<HTMLElement>): void {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.negative")) {
                row.classList.add("as-hide-negative");
            }
        }
    }
}
