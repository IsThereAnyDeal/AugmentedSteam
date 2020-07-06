import {ContextTypes} from "modules/ASContext";
import {CStorePage} from "store/common/CStorePage";

import {FExtraLinks} from "store/common/FExtraLinks";
import {FDRMWarnings} from "store/common/FDRMWarnings";
import {FITADPrices} from "store/common/FITADPrices";

import {GameId} from "core";

export class CBundlePage extends CStorePage {
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
