import {CStore} from "store/common/CStore";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FRegionalPricing from "store/common/FRegionalPricing";

export class CSale extends CStore {

    constructor() {
        super([
            FRegionalPricing,
        ]);

        this.type = ContextType.SALE;
    }
}
