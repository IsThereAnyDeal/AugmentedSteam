import BundleId from "@Core/GameId/BundleId";
import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FDRMWarnings from "../Common/FDRMWarnings";
import FExtraLinks from "../Common/FExtraLinks";
import FITADPrices from "../Common/FITADPrices";

export class CBundle extends CStoreBase {

    constructor() {

        super(ContextType.BUNDLE, [
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
        ]);

        this.bundleid = BundleId.fromUrl(window.location.host + window.location.pathname);
    }
}
