import { CStoreBase } from "../common/CStoreBase.js";
import { ContextTypes } from "../../ASContext.js";

import { FSearchFilters } from "./FSearchFilters.js";

export class CSearchPage extends CStoreBase {

    constructor() {
        super([
            FSearchFilters,
        ]);

        this.type = ContextTypes.SEARCH;

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";
    }
}
