import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CFunds extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.FUNDS, [
            FCustomGiftcardAndWallet,
        ]);
    }
}
