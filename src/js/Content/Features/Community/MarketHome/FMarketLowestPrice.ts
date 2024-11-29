import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import TimeUtils from "@Core/Utils/TimeUtils";
import Settings from "@Options/Data/Settings";
import {__loading, __lowest, __noData, __theworderror, __toomanyrequests} from "@Strings/_strings";
import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import Feature from "@Content/Modules/Context/Feature";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import RequestData from "@Content/Modules/RequestData";
import Errors from "@Core/Errors/Errors";
import Price from "@Content/Modules/Currency/Price";

export default class FMarketLowestPrice extends Feature<CMarketHome> {

    private _loadedMarketPrices: Record<string, string> = {};
    private _delayMs = 2000; // Delay to put between requests in attempt to avoid 429s
    private _delay = false; // Whether to put a delay between requests
    private _timeout = false; // Whether the user has been timed-out

    override checkPrerequisites(): boolean {
        return Settings.showlowestmarketprice
            && !Settings.hideactivelistings
            // Check if the user is signed in, and has active listings
            && document.getElementById("tabContentsMyActiveMarketListingsRows") !== null;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketListings.subscribe(() => this.callback());
    }

    private callback(): void {

        new MutationObserver(() => this._updateTableRows())
            .observe(
                document.getElementById("tabContentsMyActiveMarketListingsRows")!,
                {"childList": true}
            );

        // Update table headers
        for (const node of document.querySelectorAll("#my_market_listingsonhold_number, #my_market_selllistings_number")) {

            const listingNode = node.closest<HTMLElement>(".my_listing_section");
            if (!listingNode || listingNode.classList.contains("es_with_lowest_prices")) { continue; }
            listingNode.classList.add("es_with_lowest_prices");

            const editNode = listingNode.querySelector(".market_listing_edit_buttons");
            if (!editNode) { continue; }

            HTML.afterEnd(editNode, `<span class="market_listing_right_cell es_market_listing_lowest">${L(__lowest)}</span>`);
        }

        this._updateTableRows();
    }

    _insertPrice(node: HTMLElement, data: string): void {

        const lowestNode = node.querySelector(".es_market_listing_lowest")!;

        switch (data) {
            case "error":
                lowestNode.textContent = L(__theworderror);
                return;
            case "nodata":
                lowestNode.textContent = L(__noData);
                return;
            case "timeout":
                lowestNode.textContent = L(__toomanyrequests);
                return;
            default:
                lowestNode.textContent = data;
        }

        const myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span")!.textContent!);
        const lowPrice = Price.parseFromString(data);

        if (myPrice && lowPrice) {
            if (myPrice.value <= lowPrice.value) {
                lowestNode.classList.add("es_priced_lower"); // Our price matches the lowest price
            } else {
                lowestNode.classList.add("es_priced_higher"); // Our price is higher than the lowest price
            }
        }
    }

    async _updateTableRows() {

        const rows: HTMLElement[] = [];

        for (const node of document.querySelectorAll<HTMLElement>(".es_with_lowest_prices .market_listing_row")) {
            if (node.querySelector(".es_market_listing_lowest") !== null) { continue; }

            HTML.afterEnd(
                node.querySelector(".market_listing_edit_buttons.placeholder"),
                `<div class="market_listing_right_cell es_market_listing_lowest">${L(__loading)}</div>`
            );

            rows.push(node);
        }

        for (const node of rows) {
            const [, appid, marketHashName] = node.querySelector<HTMLAnchorElement>(".market_listing_item_name_link")?.pathname
                .match(/^\/market\/listings\/(\d+)\/([^/]+)/) ?? [];

            if (!appid || !marketHashName) {
                console.error("Couldn't find appid or market hash name for item id '%s'", node.id);
                this._insertPrice(node, "error");
                continue;
            }

            let data = this._loadedMarketPrices[marketHashName];
            if (typeof data === "undefined") {
                if (this._timeout) {
                    this._insertPrice(node, "timeout");
                    continue;
                }

                data = await this._getPriceOverview(Number(appid), marketHashName);
                this._delay = true;
            }

            this._insertPrice(node, data);
        }
    }

    async _getPriceOverview(appid: number, marketHashName: string) {

        const country = this.context.user.storeCountry;
        const currencyNumber = CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency).id;

        let data;

        if (this._delay) {
            await TimeUtils.timer(this._delayMs);
        }

        try {
            const result = await RequestData.getJson<{ // TODO check response
                success?: boolean,
                lowest_price?: string
            }>(
                `https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`
            );

            if (!result || !result.success) {
                throw new Error();
            }

            data = result.lowest_price ?? "nodata";
            this._loadedMarketPrices[marketHashName] = data;
        } catch (e) {

            // Too Many Requests
            if (e instanceof Errors.HTTPError && e.code === 429) {
                this._timeout = true;
                data = "timeout";
            } else {
                console.error("Failed to retrieve price overview for item '%s'", decodeURIComponent(marketHashName));
                data = "error";
            }
        }

        return data;
    }
}
