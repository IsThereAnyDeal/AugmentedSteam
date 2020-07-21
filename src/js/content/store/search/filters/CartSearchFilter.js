import {SimpleSearchFilter} from "store/search/filters/searchfilters";

import {Localization} from "core";

export class CartSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_cart, "cart");
    }
}
