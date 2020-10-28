import {CStoreBase} from "store/common/CStoreBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FSearchFilters from "./FSearchFilters";

export class CSearch extends CStoreBase {

    constructor() {
        super([
            FSearchFilters,
        ]);

        this.type = ContextType.SEARCH;

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";
    }
}
