import {SimpleSearchFilter} from "./SimpleSearchFilter";
import {Localization} from "../../../../Modules/Core/Localization/Localization";

export class CartSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_cart, "cart");
    }
}
