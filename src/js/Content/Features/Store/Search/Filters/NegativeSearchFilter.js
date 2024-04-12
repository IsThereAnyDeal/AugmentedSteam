import {__searchFilters_hideNegative} from "../../../../../../localization/compiled/_strings";
import {L} from "../../../../../Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class NegativeSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, L(__searchFilters_hideNegative), "negative");
    }

    _addRowMetadata(rows) {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.negative")) {
                row.classList.add("as-hide-negative");
            }
        }
    }
}
