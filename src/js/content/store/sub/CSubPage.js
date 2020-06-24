import {CStorePage} from "../common/CStorePage.js";
import {ContextTypes} from "../../ASContext.js";

import {FExtraLinks} from "../common/FExtraLinks.js";
import {FDRMWarnings} from "../common/FDRMWarnings.js";
import {FITADPrices} from "../common/FITADPrices.js";
import {FRegionalPricing} from "../common/FRegionalPricing.js";
import {FSavingsCheck} from "./FSavingsCheck.js";

import {GameId} from "../../../core.js";

export class CSubPage extends CStorePage {

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
