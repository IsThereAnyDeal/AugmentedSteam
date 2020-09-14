import {ASContext} from "modules/ASContext";
import {ContextTypes} from "modules/ASContext";

import {FCountTradeItems} from "./FCountTradeItems";

export class CTradeOfferPage extends ASContext {

    constructor() {
        super([
            FCountTradeItems,
        ]);

        this.type = ContextTypes.TRADE_OFFER;
    }
}