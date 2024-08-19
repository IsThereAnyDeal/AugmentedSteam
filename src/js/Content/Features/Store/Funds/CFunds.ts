import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";
import Context from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CFunds extends Context {

    constructor() {

        super(ContextType.FUNDS, [
            FCustomGiftcardAndWallet,
        ]);
    }
}
