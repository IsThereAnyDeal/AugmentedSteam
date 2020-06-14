import { CStorePage } from "../common/CStorePage.js";

import { FExtraLinks } from "../common/FExtraLinks.js";
import { FDRMWarnings } from "../common/FDRMWarnings.js";
import { FITADPrices } from "../common/FITADPrices.js";
import { FRegionalPricing } from "../common/FRegionalPricing.js";
import { FSavingsCheck } from "./FSavingsCheck.js";

export class CSubPage extends CStorePage {
    
    constructor() {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.subid = GameId.getSubid(window.location.host + window.location.pathname);

        this.applyFeatures();
    }
}
