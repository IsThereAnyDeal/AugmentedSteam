import {Errors, HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {CallbackFeature, CurrencyManager, Price, RequestData, User} from "../../../modulesContent";

export default class FMarketLowestPrice extends CallbackFeature {

    constructor(context) {
        super(context);

        this._loadedMarketPrices = {};
        this._delayMs = 1000; // Delay to put between requests in attempt to avoid 429s
        this._delay = false; // Whether to put a delay between requests
        this._timeout = false; // Whether the user has been timed-out
    }

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("showlowestmarketprice") && !SyncedStorage.get("hideactivelistings");
    }

    setup() {
        this.callback();
    }

    callback() {

        new MutationObserver(() => { this._updateTableRows(); })
            .observe(document.getElementById("tabContentsMyActiveMarketListingsRows"), {"childList": true});

        // Update table headers
        for (const node of document.querySelectorAll("#my_market_listingsonhold_number, #my_market_selllistings_number")) {

            const listingNode = node.closest(".my_listing_section");
            if (listingNode.classList.contains("es_with_lowest_prices")) { continue; }
            listingNode.classList.add("es_with_lowest_prices");

            const editNode = listingNode.querySelector(".market_listing_edit_buttons");
            if (!editNode) { continue; }

            HTML.afterEnd(editNode, `<span class="market_listing_right_cell es_market_listing_lowest">${Localization.str.lowest}</span>`);
        }

        this._updateTableRows();
    }

    _insertPrice(node, data) {

        const lowestNode = node.querySelector(".es_market_listing_lowest");

        switch (data) {
            case "error":
                lowestNode.textContent = Localization.str.theworderror;
                return;
            case "nodata":
                lowestNode.textContent = Localization.str.no_data;
                return;
            case "timeout":
                lowestNode.textContent = Localization.str.toomanyrequests;
                return;
            default:
                lowestNode.textContent = data;
        }

        const myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent);
        const lowPrice = Price.parseFromString(data);

        if (myPrice.value <= lowPrice.value) {
            lowestNode.classList.add("es_priced_lower"); // Our price matches the lowest price
        } else {
            lowestNode.classList.add("es_priced_higher"); // Our price is higher than the lowest price
        }
    }

    async _updateTableRows() {

        const rows = [];

        for (const node of document.querySelectorAll(".es_with_lowest_prices .market_listing_row")) {
            if (node.querySelector(".es_market_listing_lowest") !== null) { continue; }

            HTML.afterEnd(
                node.querySelector(".market_listing_edit_buttons.placeholder"),
                `<div class="market_listing_right_cell es_market_listing_lowest">${Localization.str.loading}</div>`
            );

            rows.push(node);
        }

        for (const node of rows) {
            const [, appid, marketHashName] = node.querySelector(".market_listing_item_name_link")?.pathname
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

                data = await this._getPriceOverview(node, Number(appid), marketHashName);
                this._delay = true;
            }

            this._insertPrice(node, data);
        }
    }

    async _getPriceOverview(node, appid, marketHashName) {

        const country = User.storeCountry;
        const currencyNumber = CurrencyManager.currencyTypeToNumber(CurrencyManager.storeCurrency);

        let data;

        if (this._delay) {
            await TimeUtils.timer(this._delayMs);
        }

        try {
            const result = await RequestData.getJson(
                `https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`
            );

            if (!result || !result.success) {
                throw new Error();
            }

            data = result.lowest_price || "nodata";
            this._loadedMarketPrices[marketHashName] = data;
        } catch (err) {

            // Too Many Requests
            if (err instanceof Errors.HTTPError && err.code === 429) {
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
