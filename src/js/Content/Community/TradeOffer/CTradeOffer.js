import {Context, ContextType} from "../../../Modules/Content";
import FCountTradeItems from "./FCountTradeItems";

export class CTradeOffer extends Context {

    constructor() {
        super(ContextType.TRADE_OFFER, [
            FCountTradeItems,
        ]);
    }
}
