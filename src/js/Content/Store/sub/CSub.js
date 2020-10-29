import ContextType from "../../../Modules/Content/Context/ContextType";
import {GameId} from "../../../Modules/Core/GameId";
import {CStore} from "../common/CStore";
import FExtraLinks from "../common/FExtraLinks";
import FDRMWarnings from "../common/FDRMWarnings";
import FITADPrices from "../common/FITADPrices";
import FRegionalPricing from "../common/FRegionalPricing";
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
