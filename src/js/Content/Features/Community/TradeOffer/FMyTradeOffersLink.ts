import {__tradeoffer_back} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CTradeOffer from "@Content/Features/Community/TradeOffer/CTradeOffer";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

export default class FMyTradeOffersLink extends Feature<CTradeOffer> {

    override apply(): void {

        HTML.beforeEnd(
            document.querySelector(".error_page_links")!,
            `<div class="black_square_btn" id="back_to_tradeoffers_btn"> <a href="https://steamcommunity.com/my/tradeoffers"><div class="cap left"></div><div class="cap right"></div>${L(__tradeoffer_back)}</a></div>`
        );
    }
}
