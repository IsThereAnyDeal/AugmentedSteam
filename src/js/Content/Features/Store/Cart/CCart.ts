import FCartHistoryLink from "./FCartHistoryLink";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";

export default class CCart extends Context {

    constructor(params: ContextParams) {

        super(params, ContextType.CART, [
            FCartHistoryLink,
        ]);
    }
}
