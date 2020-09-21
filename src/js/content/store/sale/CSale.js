import {CStore} from "store/common/CStore";
import {ContextTypes} from "modules";

import {FRegionalPricing} from "store/common/FRegionalPricing";

export class CSale extends CStore {

    constructor() {
        super([
            FRegionalPricing,
        ]);

        this.type = ContextTypes.SALE;
    }
}
