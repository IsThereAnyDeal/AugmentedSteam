import {Localization} from "../../../../../Core/Localization/Localization";
import {SimpleSearchFilter} from "./SimpleSearchFilter";

export class SubPackageSearchFilter extends SimpleSearchFilter {

    constructor(feature) {
        super("as-hide", feature, Localization.str.search_filters.hide_sub_package, "sub-package");
    }

    _addRowMetadata(rows) {
        for (const row of rows) {
            if (this._isSubPackage(row)) {
                row.classList.add("as-hide-sub-package");
            }
        }
    }

    _isSubPackage(row) {
        // There is probably a better way to do this.
        return row.href.includes("/sub/");
    }
}
