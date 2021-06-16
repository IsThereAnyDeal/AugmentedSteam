import {Context, ContextType} from "../../../modulesContent";
import FCustomGiftcardAndWallet from "./FCustomGiftcardAndWallet";

export class CFunds extends Context {

    constructor() {

        super(ContextType.FUNDS, [
            FCustomGiftcardAndWallet,
        ]);
    }
}
