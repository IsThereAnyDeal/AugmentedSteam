import {Context} from "../../../Modules/Context/Context";
import ContextType from "../../../Modules/Context/ContextType";

import FCountTradeItems from "./FCountTradeItems";
import FMyTradeOffersLink from "./FMyTradeOffersLink";

export class CTradeOffer extends Context {

    constructor() {
        super(ContextType.TRADE_OFFER, [
            FCountTradeItems,
            FMyTradeOffersLink,
        ]);
    }
}
