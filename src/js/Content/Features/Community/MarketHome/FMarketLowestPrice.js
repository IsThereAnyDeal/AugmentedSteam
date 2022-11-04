import {Errors, HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {CurrencyManager, Feature, Price, RequestData, User} from "../../../modulesContent";

export default class FMarketLowestPrice extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("showlowestmarketprice") && !SyncedStorage.get("hideactivelistings");
    }

    apply() {

        this._loadedMarketPrices = {};
        this._parentNode = document.getElementById("tabContentsMyListings");

        new MutationObserver(() => { this._insertPrices(); })
            .observe(document.getElementById("tabContentsMyActiveMarketListingsRows"), {"childList": true});

        // update tables' headers
        for (const node of this._parentNode.querySelectorAll("#my_market_listingsonhold_number, #my_market_selllistings_number")) {

            const listingNode = node.closest(".my_listing_section");
            if (listingNode.classList.contains("es_selling")) { continue; }
            listingNode.classList.add("es_selling");

            const editNode = listingNode.querySelector(".market_listing_edit_buttons");
            if (!editNode) { continue; }

            editNode.style.width = "200px";
            HTML.afterEnd(editNode, `<span class="market_listing_right_cell es_market_listing_lowest">${Localization.str.lowest}</span>`);
        }

        this._insertPrices();
    }

    async _insertPrices() {

        // update table rows
        const rows = [];

        for (const node of this._parentNode.querySelectorAll(".es_selling .market_listing_row")) {
            if (node.querySelector(".es_market_listing_lowest") !== null) { continue; }

            const button = node.querySelector(".market_listing_edit_buttons.placeholder");
            button.style.width = "200px";

            HTML.afterEnd(button, `<div class="market_listing_right_cell es_market_listing_lowest">${Localization.str.loading}</div>`);

            // Move the actual button due to changed width
            const actualButton = node.querySelector(".market_listing_edit_buttons.actual_content");
            actualButton.style.width = "inherit";
            button.append(actualButton);

            rows.push(node);
        }

        for (const node of rows) {
            const linkNode = node.querySelector(".market_listing_item_name_link");
            if (!linkNode) { continue; }

            const [, appid, marketHashName] = linkNode.pathname.match(/^\/market\/listings\/(\d+)\/([^/]+)/) || [];
            if (!appid || !marketHashName) { continue; }

            const lowestNode = node.querySelector(".es_market_listing_lowest");
            const data = this._loadedMarketPrices[marketHashName] || await this._getPriceOverview(node, Number(appid), marketHashName);

            if (!data) {
                lowestNode.textContent = Localization.str.theworderror;
                continue;
            }

            if (!("lowest_price" in data)) {
                lowestNode.textContent = Localization.str.no_data;
                continue;
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
    }

    async _getPriceOverview(node, appid, marketHashName) {

        const country = User.storeCountry;
        const currencyNumber = CurrencyManager.currencyTypeToNumber(CurrencyManager.storeCurrency);

        let data;
        let attempt = 0;

        do {
            try {
                data = await RequestData.getJson(
                    `https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`
                );

                if (!data || !data.success) {
                    throw new Error();
                }

                this._loadedMarketPrices[marketHashName] = data;
                await TimeUtils.timer(1000);
                break;
            } catch (err) {

                // Too Many Requests
                if (err instanceof Errors.HTTPError && err.code === 429) {
                    await TimeUtils.timer(30000);
                    attempt++;

                    // If the node is detached after this timeout
                    if (!node.parentNode) { break; }
                } else {
                    console.error("Failed to retrieve price overview for item %s!", decodeURIComponent(marketHashName));
                    break;
                }
            }
        } while (attempt < 2); // Give up after 2 tries

        return data;
    }
}
