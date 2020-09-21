import {CStoreBase} from "store/common/CStoreBase";
import {ContextTypes} from "modules";

import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";

export class CFunds extends CStoreBase {

    constructor() {
        super([
            FCustomGiftcardAndWallet,
        ]);

        this.type = ContextTypes.FUNDS;
    }
}
