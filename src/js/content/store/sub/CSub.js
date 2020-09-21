import {CStore} from "store/common/CStore";
import {ContextTypes} from "modules";

import FExtraLinks from "store/common/FExtraLinks";
import FDRMWarnings from "store/common/FDRMWarnings";
import FITADPrices from "store/common/FITADPrices";
import FRegionalPricing from "store/common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";

import {GameId} from "core";

export class CSub extends CStore {

    constructor() {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.type = ContextTypes.SUB;

        this.subid = GameId.getSubid(window.location.host + window.location.pathname);
    }
}
