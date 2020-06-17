import { CStorePage } from "../common/CStorePage.js";
import { ContextTypes } from "../../ASContext.js";

import { FRegionalPricing } from "../common/FRegionalPricing.js";

export class CSalePage extends CStorePage {

    constructor() {
        super([
            FRegionalPricing,
        ]);

        this.type = ContextTypes.SALE;

        this.applyFeatures();
    }
}
