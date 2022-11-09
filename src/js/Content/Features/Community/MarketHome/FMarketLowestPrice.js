import {Errors, HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {CallbackFeature, CurrencyManager, Price, RequestData, User} from "../../../modulesContent";

export default class FMarketLowestPrice extends CallbackFeature {

    constructor(context) {
        super(context);

        this._loadedMarketPrices = {};
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

        if (typeof data === "undefined") {
            lowestNode.textContent = Localization.str.theworderror;
            return;
        }

        if (typeof data.lowest_price === "undefined") {
            lowestNode.textContent = Localization.str.no_data;
            return;
        }

        lowestNode.textContent = data.lowest_price;

        const myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent);
        const lowPrice = Price.parseFromString(data.lowest_price);

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

        // Put a delay between requests
        let delay = false;

        for (const node of rows) {
            const [, appid, marketHashName] = node.querySelector(".market_listing_item_name_link")?.pathname
                .match(/^\/market\/listings\/(\d+)\/([^/]+)/) ?? [];

            if (!appid || !marketHashName) {
                console.error("Couldn't find appid or market hash name for item id %s", node.id);
                this._insertPrice(node);
                continue;
            }

            let data = this._loadedMarketPrices[marketHashName];
            if (!data) {
                data = await this._getPriceOverview(node, Number(appid), marketHashName, delay);
                delay = true;
            }

            this._insertPrice(node, data);
        }
    }

    async _getPriceOverview(node, appid, marketHashName, delay) {

        const country = User.storeCountry;
        const currencyNumber = CurrencyManager.currencyTypeToNumber(CurrencyManager.storeCurrency);

        let data;
        let attempt = 0;

        do {
            if (delay && attempt === 0) {
                await TimeUtils.timer(1000);
            }

            try {
                data = await RequestData.getJson(
                    `https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`
                );

                if (!data || !data.success) {
                    throw new Error();
                }

                this._loadedMarketPrices[marketHashName] = data;
                break;
            } catch (err) {

                // Too Many Requests
                if (err instanceof Errors.HTTPError && err.code === 429) {
                    await TimeUtils.timer(30000);

                    // If the node is detached after the timeout
                    if (!node.parentNode) { break; }

                    attempt++;
                } else {
                    console.error("Failed to retrieve price overview for item %s!", decodeURIComponent(marketHashName));
                    break;
                }
            }
        } while (attempt < 2); // Give up after 2 tries

        return data;
    }
}
