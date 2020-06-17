import { CStoreBase } from "../common/CStoreBase.js";
import { ContextTypes } from "../../ASContext.js";

import { FCustomGiftcardAndWallet } from "./FCustomGiftcardAndWallet.js";

export class CFundsPage extends CStoreBase {

    constructor() {
        super([
            FCustomGiftcardAndWallet,
        ]);

        this.type = ContextTypes.FUNDS;

        this.applyFeatures();
    }
}
