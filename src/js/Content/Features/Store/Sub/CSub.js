import ContextType from "../../../Modules/Context/ContextType";
import {GameId} from "../../../../Core/GameId";
import {CStoreBase} from "../Common/CStoreBase";
import FExtraLinks from "../Common/FExtraLinks";
import FDRMWarnings from "../Common/FDRMWarnings";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";

export class CSub extends CStoreBase {

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
