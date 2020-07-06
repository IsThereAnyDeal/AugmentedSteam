import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules/ASContext";

import {FCustomGiftcardAndWallet} from "store/funds/FCustomGiftcardAndWallet";

export class CFundsPage extends CStoreBase {

    constructor() {
        super([
            FCustomGiftcardAndWallet,
        ]);

        this.type = ContextTypes.FUNDS;
    }
}
