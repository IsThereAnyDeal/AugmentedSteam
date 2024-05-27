import SimpleSearchFilter from "./SimpleSearchFilter";
import {__searchFilters_hideCart} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type FSearchFilters from "@Content/Features/Store/Search/FSearchFilters";

export default class CartSearchFilter extends SimpleSearchFilter {

    constructor(feature: FSearchFilters) {
        super("as-hide", feature, L(__searchFilters_hideCart), "cart");
    }
}
