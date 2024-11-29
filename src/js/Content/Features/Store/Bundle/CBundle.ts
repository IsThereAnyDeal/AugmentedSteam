import BundleId from "@Core/GameId/BundleId";
import CStoreBase from "../Common/CStoreBase";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinksCommon from "../Common/FExtraLinksCommon";
import FITADPrices from "../Common/FITADPrices";
import ContextType from "@Content/Modules/Context/ContextType";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CBundle extends CStoreBase {

    public readonly appid: undefined = undefined;
    public readonly bundleid: number;

    constructor(params: ContextParams) {

        super(params, ContextType.BUNDLE, [
            FExtraLinksCommon,
            FDRMWarnings,
            FITADPrices
        ]);

        this.bundleid = BundleId.fromUrl(window.location.host + window.location.pathname)!;
    }
}
