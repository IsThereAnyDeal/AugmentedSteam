import Context, {type ContextParams} from "../../../Modules/Context/Context";
import ContextType from "@Content/Modules/Context/ContextType";
import FCountTradeItems from "./FCountTradeItems";
import FMyTradeOffersLink from "./FMyTradeOffersLink";

export default class CTradeOffer extends Context {

    constructor(params: ContextParams) {
        const isErrorPage = document.querySelector(".error_page_links") !== null;

        super(params, ContextType.TRADE_OFFER, isErrorPage ? [
            FMyTradeOffersLink,
        ] : [
            FCountTradeItems,
        ]);
    }
}
