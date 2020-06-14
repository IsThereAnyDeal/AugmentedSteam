import { CStorePage } from "../common/CStorePage.js";

import { FRegionalPricing } from "../common/FRegionalPricing.js";

export class CSalePage extends CStorePage {

    constructor() {
        super([
            FRegionalPricing,
        ]);

        this.applyFeatures();
    }
}
