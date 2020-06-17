import { ContextTypes } from "../../ASContext.js";
import { CStorePage } from "../common/CStorePage.js";

import { FExtraLinks } from "../common/FExtraLinks.js";
import { FDRMWarnings } from "../common/FDRMWarnings.js";
import { FITADPrices } from "../common/FITADPrices.js";

import { GameId } from "../../../core.js";

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
