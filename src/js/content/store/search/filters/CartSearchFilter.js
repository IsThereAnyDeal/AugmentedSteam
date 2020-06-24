import {SimpleSearchFilter} from "./searchfilters.js";

import {Localization} from "../../../../language.js";

export class CartSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_cart, "cart");
    }
}
