import {ASContext, ContextTypes} from "modules";

import {FCountTradeItems} from "./FCountTradeItems";

export class CTradeOfferPage extends ASContext {

    constructor() {
        super([
            FCountTradeItems,
        ]);

        this.type = ContextTypes.TRADE_OFFER;
    }
}