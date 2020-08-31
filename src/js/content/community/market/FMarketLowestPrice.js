import {ASFeature} from "modules/ASFeature";

import {HTML, Localization, sleep, SyncedStorage} from "core";
import {Currency, HTTPError, Price, RequestData, User} from "common";

export class FMarketLowestPrice extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("showlowestmarketprice") && !SyncedStorage.get("hideactivelistings");
    }

    apply() {

        this._loadedMarketPrices = {};
        this._parentNode = document.getElementById("tabContentsMyListings");

        new MutationObserver(() => { this._insertPrices(); })
            .observe(document.getElementById("tabContentsMyActiveMarketListingsRows"), {childList: true});

        // update tables' headers
        for (let node of this._parentNode.querySelectorAll("#my_market_listingsonhold_number,#my_market_selllistings_number")) {

            let listingNode = node.closest(".my_listing_section");
            if (listingNode.classList.contains("es_selling")) { continue; }
            listingNode.classList.add("es_selling");

            let headerNode = listingNode.querySelector(".market_listing_table_header span");
            if (!headerNode) { continue; }

            headerNode.style.width = "200px"; // TODO do we still need to change width?
            HTML.afterEnd(headerNode,
                "<span class='market_listing_right_cell market_listing_my_price'><span class='es_market_lowest_button'>" + Localization.str.lowest + "</span></span>");
        }

        this._insertPrices();
    }

    _insertPrice(node, data) {

        node.classList.add("es_priced");

        let lowestNode = node.querySelector(".market_listing_es_lowest");
        lowestNode.textContent = data['lowest_price'];

        let myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent);
        let lowPrice = Price.parseFromString(data['lowest_price']);

        if (myPrice.value <= lowPrice.value) {
            lowestNode.classList.add("es_percentage_lower"); // Ours matches the lowest price
        } else {
            lowestNode.classList.add("es_percentage_higher"); // Our price is higher than the lowest price
        }
    }

    async _insertPrices() {

        // update table rows
        let rows = [];
        
        for (let node of this._parentNode.querySelectorAll(".es_selling .market_listing_row")) {
            if (node.querySelector(".market_listing_es_lowest")) { continue; }
            let button = node.querySelector(".market_listing_edit_buttons");
            button.style.width = "200px"; // TODO do we still need to change width?

            HTML.afterEnd(node.querySelector(".market_listing_edit_buttons"),
                "<div class='market_listing_right_cell market_listing_my_price market_listing_es_lowest'>&nbsp;</div>");

            // we do this because of changed width, right?
            let actualButton = node.querySelector(".market_listing_edit_buttons.actual_content");
            actualButton.style.width = "inherit";
            button.append(actualButton);

            rows.push(node);
        }

        for (let node of rows) {
            let linkNode = node.querySelector(".market_listing_item_name_link");
            if (!linkNode) { continue; }

            let m = linkNode.href.match(/\/(\d+)\/(.+)$/);
            if (!m) { continue; }
            let appid = parseInt(m[1]);
            let marketHashName = m[2];

            let allowInsert = true;

            let priceData;
            let done;
            if (this._loadedMarketPrices[marketHashName]) {
                priceData = this._loadedMarketPrices[marketHashName];
            } else {
                do {
                    try {
                        let data = await RequestData.getJson(
                            `https://steamcommunity.com/market/priceoverview/?country=${User.storeCountry}&currency=${Currency.currencyTypeToNumber(Currency.storeCurrency)}&appid=${appid}&market_hash_name=${marketHashName}`
                        );

                        await sleep(1000);

                        done = true;
                        this._loadedMarketPrices[marketHashName] = data;
                        priceData = data;
                    } catch(err) {
                        // Too Many Requests
                        if (err instanceof HTTPError && err.code === 429) {
                            await sleep(30000);
                            if (node) {
                                done = false;
                            } else {
                                return;
                            }
                        } else {
                            console.error("Failed to retrieve price overview for item %s!", marketHashName);
                            allowInsert = false;
                            break;
                        }
                        
                    }
                } while (!done);
            }

            if (allowInsert) {
                this._insertPrice(node, priceData);
            }
        }
    }
}
