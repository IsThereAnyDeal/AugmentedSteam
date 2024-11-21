import SubId from "@Core/GameId/SubId";
import ContextType from "@Content/Modules/Context/ContextType";
import CStoreBase from "../Common/CStoreBase";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinksCommon from "../Common/FExtraLinksCommon";
import FITADPrices from "../Common/FITADPrices";
import FRegionalPricing from "../Common/FRegionalPricing";
import FSavingsCheck from "./FSavingsCheck";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CSub extends CStoreBase {

    public readonly appid: undefined = undefined;
    public readonly subid: number;

    constructor(params: ContextParams) {

        super(params, ContextType.SUB, [
            FExtraLinksCommon,
            FDRMWarnings,
            FITADPrices,
            FRegionalPricing,
            FSavingsCheck,
        ]);

        this.subid = SubId.fromUrl(window.location.host + window.location.pathname)!;
    }
}
