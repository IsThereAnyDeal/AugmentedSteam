import FSearchFilters from "./FSearchFilters";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CSearch extends CStoreBase {

    public readonly infiniScrollEnabled: boolean;

    constructor() {
        super(ContextType.SEARCH, [
            FSearchFilters,
        ]);

        this.infiniScrollEnabled = document.querySelector<HTMLElement>(".search_pagination")?.style.display === "none";
    }
}
