import {Context, ContextType} from "../../../modulesContent";
import FCartHistoryLink from "./FCartHistoryLink";

export class CCart extends Context {

    constructor() {

        super(ContextType.CART, [
            FCartHistoryLink,
        ]);
    }
}
