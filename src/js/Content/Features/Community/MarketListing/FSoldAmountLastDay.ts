import {__soldLast_24} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import RequestData from "@Content/Modules/RequestData";
import HTML from "@Core/Html/Html";

export default class FSoldAmountLastDay extends Feature<CMarketListing> {

    override checkPrerequisites(): boolean {
        return document.getElementById("pricehistory") !== null;
    }

    async apply() {

        const country = this.context.user.storeCountry;
        const currencyNumber = CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency).id;

        const data = await RequestData.getJson<{
            success?: boolean,
            volume?: number
        }>(`https://steamcommunity.com/market/priceoverview/?appid=${this.context.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${this.context.marketHashName}`);
        if (!data.success) { return; }

        const soldHtml
            = `<div class="es_sold_amount">
                   ${L(__soldLast_24, {
                       "sold": `<span class="market_commodity_orders_header_promote">${data.volume ?? 0}</span>`
                   })}
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
        }).observe(
            document.querySelector("#pricehistory")!,
            {"childList": true}
        );
    }
}
