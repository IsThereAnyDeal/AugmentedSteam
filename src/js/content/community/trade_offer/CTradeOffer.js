import {Context, ContextTypes} from "modules";

import {FCountTradeItems} from "./FCountTradeItems";

export class CTradeOffer extends Context {

    constructor() {
        super([
            FCountTradeItems,
        ]);

        this.type = ContextTypes.TRADE_OFFER;
    }
}