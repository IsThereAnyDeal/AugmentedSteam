import ContextType from "../../../Modules/Content/Context/ContextType";
import {CStoreBase} from "../common/CStoreBase";
import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";

export class CFunds extends CStoreBase {

    constructor() {
        super(ContextType.FUNDS, [
            FCustomGiftcardAndWallet,
        ]);
    }
}
