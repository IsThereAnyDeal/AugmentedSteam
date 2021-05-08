import {HTML, Localization} from "../../../../modulesCore";
import {CurrencyManager, Feature, RequestData, User} from "../../../modulesContent";

export default class FSoldAmountLastDay extends Feature {

    checkPrerequisites() {
        return document.getElementById("pricehistory") !== null;
    }

    async apply() {

        const country = User.storeCountry;
        const currencyNumber = CurrencyManager.currencyTypeToNumber(CurrencyManager.storeCurrency);

        const data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?appid=${this.context.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${this.context.marketHashName}`);
        if (!data.success) { return; }

        const soldHtml
            = `<div class="es_sold_amount">
                   ${Localization.str.sold_last_24.replace("__sold__", `<span class="market_commodity_orders_header_promote">${data.volume || 0}</span>`)}
               </div>`;

        const nodes = document.querySelectorAll("#market_commodity_order_spread > :nth-child(2) .market_commodity_orders_header, #pricehistory .jqplot-title, #listings .market_section_title");
        for (const node of nodes) {
            HTML.beforeEnd(node, soldHtml);
        }

        // retain sold amount info after changing zoom controls
        new MutationObserver(() => {
            if (!document.querySelector("#pricehistory .es_sold_amount")) {
                HTML.beforeEnd("#pricehistory .jqplot-title", soldHtml);
            }
        }).observe(document.querySelector("#pricehistory"), {"childList": true});
    }
}
