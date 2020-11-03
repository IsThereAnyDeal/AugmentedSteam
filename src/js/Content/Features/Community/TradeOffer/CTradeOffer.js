import {Context, ContextType} from "../../../modulesContent";
import FCountTradeItems from "./FCountTradeItems";

export class CTradeOffer extends Context {

    constructor() {
        super(ContextType.TRADE_OFFER, [
            FCountTradeItems,
        ]);
    }
}
