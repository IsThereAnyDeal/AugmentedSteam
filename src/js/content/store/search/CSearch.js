import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules";

import {FSearchFilters} from "store/search/FSearchFilters";

export class CSearch extends CStoreBase {

    constructor() {
        super([
            FSearchFilters,
        ]);

        this.type = ContextTypes.SEARCH;

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";
    }
}
