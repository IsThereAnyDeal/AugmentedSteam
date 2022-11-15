import ContextType from "../../../Modules/Context/ContextType";
import {CStoreBase} from "../Common/CStoreBase";
import FCartHistoryLink from "./FCartHistoryLink";

export class CCart extends CStoreBase {

    constructor() {

        super(ContextType.CART, [
            FCartHistoryLink,
        ]);
    }
}
