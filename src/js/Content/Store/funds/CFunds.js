import {CStoreBase} from "store/common/CStoreBase";
import ContextType from "../../../Modules/Content/Context/ContextType";

import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";

export class CFunds extends CStoreBase {

    constructor() {
        super([
            FCustomGiftcardAndWallet,
        ]);

        this.type = ContextType.FUNDS;
    }
}
