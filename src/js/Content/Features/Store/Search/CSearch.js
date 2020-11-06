import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FSearchFilters from "./FSearchFilters";

export class CSearch extends CStoreBase {

    constructor() {
        super(ContextType.SEARCH, [
            FSearchFilters,
        ]);

        this.infiniScrollEnabled = document.querySelector(".search_pagination").style.display === "none";
    }
}
