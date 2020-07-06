import {CStorePage} from "store/common/CStorePage";
import {ContextTypes} from "modules/ASContext";

import {FExtraLinks} from "store/common/FExtraLinks";
import {FDRMWarnings} from "store/common/FDRMWarnings";
import {FITADPrices} from "store/common/FITADPrices";
import {FRegionalPricing} from "store/common/FRegionalPricing";
import {FSavingsCheck} from "store/sub/FSavingsCheck";

import {GameId} from "core";

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
