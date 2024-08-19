import FCartHistoryLink from "./FCartHistoryLink";
import Context from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CCart extends Context {

    constructor() {

        super(ContextType.CART, [
            FCartHistoryLink,
        ]);
    }
}
