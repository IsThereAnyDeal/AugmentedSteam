import {__searchFilters_hideCart} from "../../../../../../localization/compiled/_strings";
import {L} from "../../../../../Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class CartSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, L(__searchFilters_hideCart), "cart");
    }
}
