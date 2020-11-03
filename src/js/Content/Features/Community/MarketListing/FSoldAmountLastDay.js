import {HTML, Localization} from "../../../../modulesCore";
import {CurrencyManager, DOMHelper, Feature, RequestData, User} from "../../../modulesContent";

export default class FSoldAmountLastDay extends Feature {

    checkPrerequisites() {
        return this.context.appid !== null;
    }

    async apply() {

        const country = User.storeCountry;
        const currencyNumber = CurrencyManager.currencyTypeToNumber(CurrencyManager.storeCurrency);

        const link = DOMHelper.selectLastNode(document, '.market_listing_nav a[href^="https://steamcommunity.com/market/"]').href;
        const marketHashName = (link.match(/\/\d+\/(.+)$/) || [])[1];

        const data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?appid=${this.context.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${marketHashName}`);
        if (!data.success) { return; }

        const soldHtml
            = `<div class="es_sold_amount">
                   ${Localization.str.sold_last_24.replace("__sold__", `<span class="market_commodity_orders_header_promote">${data.volume || 0}</span>`)}
               </div>`;

        HTML.beforeBegin(".market_commodity_buy_button", soldHtml);

        /*
         * TODO where is this observer applied?
         * let observer = new MutationObserver(function(){
         *  if (!document.querySelector("#pricehistory .es_sold_amount")) {
         *      document.querySelector(".jqplot-title").insertAdjacentHTML("beforeend", soldHtml);
         *  }
         *  return true;
         * });
         * observer.observe(document, {}); // .jqplot-event-canvas
         */
    }
}
