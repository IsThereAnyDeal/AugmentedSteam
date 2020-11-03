import {Localization} from "../../../../../Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class MixedSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_mixed, "mixed");
    }

    _addRowMetadata(rows) {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.mixed")) {
                row.classList.add("as-hide-mixed");
            }
        }
    }
}
