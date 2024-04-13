import {ContextType} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FCartHistoryLink from "./FCartHistoryLink";

export class CCart extends CStoreBase {

    constructor() {

        super(ContextType.CART, [
            FCartHistoryLink,
        ]);
    }
}
