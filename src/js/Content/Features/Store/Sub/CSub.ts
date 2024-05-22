import SubId from "@Core/GameId/SubId";
import {ContextType} from "../../../Modules/Context/ContextType";
import CStoreBase from "../Common/CStoreBase";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinksCommon from "../Common/FExtraLinksCommon";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";

export default class CSub extends CStoreBase {

    public readonly appid: undefined = undefined;
    public readonly subid: number;

    constructor() {

        super(ContextType.SUB, [
            FExtraLinksCommon,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.subid = SubId.fromUrl(window.location.host + window.location.pathname)!;
    }
}
