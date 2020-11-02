import {Localization} from "../../../../Modules/Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class NegativeSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_negative, "negative");
    }

    _addRowMetadata(rows) {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.negative")) {
                row.classList.add("as-hide-negative");
            }
        }
    }
}
