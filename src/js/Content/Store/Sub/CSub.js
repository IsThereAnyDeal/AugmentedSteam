import ContextType from "../../../Modules/Content/Context/ContextType";
import {GameId} from "../../../Modules/Core/GameId";
import {CStore} from "../Common/CStore";
import FExtraLinks from "../Common/FExtraLinks";
import FDRMWarnings from "../Common/FDRMWarnings";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";

export class CSub extends CStore {

    constructor() {

        super(ContextType.SUB, [
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.subid = GameId.getSubid(window.location.host + window.location.pathname);
    }
}
