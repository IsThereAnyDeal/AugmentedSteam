import {CStore} from "store/common/CStore";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FExtraLinks from "store/common/FExtraLinks";
import FDRMWarnings from "store/common/FDRMWarnings";
import FITADPrices from "store/common/FITADPrices";
import FRegionalPricing from "store/common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";

import {GameId} from "../../../Modules/Core/GameId";

export class CSub extends CStore {

    constructor() {

        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.type = ContextType.SUB;

        this.subid = GameId.getSubid(window.location.host + window.location.pathname);
    }
}
