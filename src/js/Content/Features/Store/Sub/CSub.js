import SubId from "@Core/GameId/SubId";
import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinks from "../Common/FExtraLinks";
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

        this.subid = SubId.fromUrl(window.location.host + window.location.pathname);
    }
}
