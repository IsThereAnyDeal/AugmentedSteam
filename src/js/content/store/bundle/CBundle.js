import {ContextTypes} from "modules";
import {CStore} from "store/common/CStore";

import {FExtraLinks} from "store/common/FExtraLinks";
import {FDRMWarnings} from "store/common/FDRMWarnings";
import {FITADPrices} from "store/common/FITADPrices";

import {GameId} from "core";

export class CBundle extends CStore {
    constructor() {
        super([
            FExtraLinks,
            FDRMWarnings,
            FITADPrices,
        ]);

        this.type = ContextTypes.BUNDLE;

        this.bundleid = GameId.getBundleid(window.location.host + window.location.pathname);
    }
}
