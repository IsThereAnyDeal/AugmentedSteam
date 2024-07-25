import Context from "../../../Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";
import FCountTradeItems from "./FCountTradeItems";
import FMyTradeOffersLink from "./FMyTradeOffersLink";

export default class CTradeOffer extends Context {

    constructor() {
        super(ContextType.TRADE_OFFER, [
            FCountTradeItems,
            FMyTradeOffersLink,
        ]);
    }
}
