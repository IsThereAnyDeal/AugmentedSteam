import ContextType from "../../../Modules/Content/Context/ContextType";
import {GameId} from "../../../Modules/Core/GameId";
import {CStore} from "../common/CStore";
import FExtraLinks from "../common/FExtraLinks";
import FDRMWarnings from "../common/FDRMWarnings";
import FITADPrices from "../common/FITADPrices";

export class CBundle extends CStore {
    constructor() {
        super(ContextType.BUNDLE, [
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
        ]);

        this.bundleid = GameId.getBundleid(window.location.host + window.location.pathname);
    }
}
