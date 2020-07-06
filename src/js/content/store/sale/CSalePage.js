import {CStorePage} from "store/common/CStorePage";
import {ContextTypes} from "modules/ASContext";

import {FRegionalPricing} from "store/common/FRegionalPricing";

export class CSalePage extends CStorePage {

    constructor() {
        super([
            FRegionalPricing,
        ]);

        this.type = ContextTypes.SALE;
    }
}
