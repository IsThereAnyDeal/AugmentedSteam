import FSearchFilters from "./FSearchFilters";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import ContextType from "@Content/Modules/Context/ContextType";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CSearch extends CStoreBase {

    public readonly infiniScrollEnabled: boolean;

    constructor(params: ContextParams) {
        super(params, ContextType.SEARCH, [
            FSearchFilters,
        ]);

        this.infiniScrollEnabled = document.querySelector<HTMLElement>(".search_pagination")?.style.display === "none";
    }
}
