import {SimpleSearchFilter} from "./searchfilters.js";

import {Localization} from "../../../../language.js";

export class NegativeSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_negative, "negative");
    }

    addRowMetadata(rows) {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.negative")) {
                row.classList.add("as-hide-negative");
            }
        }
    }
}
