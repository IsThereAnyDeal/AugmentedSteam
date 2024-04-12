import {__searchFilters_hideMixed} from "../../../../../../localization/compiled/_strings";
import {L} from "../../../../../Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class MixedSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, L(__searchFilters_hideMixed), "mixed");
    }

    _addRowMetadata(rows) {
        for (const row of rows) {
            if (row.querySelector(".search_reviewscore span.search_review_summary.mixed")) {
                row.classList.add("as-hide-mixed");
            }
        }
    }
}
