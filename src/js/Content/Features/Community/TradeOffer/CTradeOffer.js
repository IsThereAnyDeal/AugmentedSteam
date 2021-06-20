import {Context, ContextType} from "../../../modulesContent";
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
