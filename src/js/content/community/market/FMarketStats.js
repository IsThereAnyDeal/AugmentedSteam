import {Feature} from "modules";

import {HTML, HTMLParser, Localization, LocalStorage, sleep, SyncedStorage} from "core";
import {Price, RequestData, User} from "common";

export class FMarketStats extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        HTML.beforeBegin("#findItems",
                `<div id="es_summary">
                    <div class="market_search_sidebar_contents">
                        <h2 class="market_section_title">${Localization.str.market_transactions}</h2>
                        <div id="es_market_summary_status"></div>
                        <div class="market_search_game_button_group" id="es_market_summary" style="display:none;"></div>
                    </div>
                </div>`);

        this._node = document.getElementById("es_market_summary_status")
        HTML.inner(this._node, `<a class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"><span>${Localization.str.load_market_stats}</span></a>`);

        document.querySelector("#es_market_summary_button").addEventListener("click", () => { this._startLoading(); });

        if (SyncedStorage.get("showmarkettotal")) {
            this._startLoading();
        }
    }

    async _startLoading() {

        HTML.inner(this._node,
            `<img id="es_market_summary_throbber" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">
                <span><span id="esi_market_stats_progress_description">${Localization.str.loading} </span><span id="esi_market_stats_progress"></span>
            </span>`);

        document.querySelector("#es_market_summary").style.display = null;

        let success = await this._load();
        if (this._node && success) {
            this._node.remove();
            // this._node.style.display = "none";
        } else {
            let el = document.getElementById('es_market_summary_throbber');
            if (el) el.remove();
            el = document.getElementById('esi_market_stats_progress_description');
            if (el) el.remove();
        }
    }

    async _load() {
        
        let {startListing, purchaseTotal, saleTotal} = LocalStorage.get("market_stats", { startListing: null, purchaseTotal: 0, saleTotal: 0 });
        let curStartListing = null;
        let transactions = new Set();
        let stop = false;

        // If startListing is missing, reset cached data to avoid inaccurate results.
        if (startListing === null && (purchaseTotal > 0 || saleTotal > 0)) {
            purchaseTotal = 0;
            saleTotal = 0;
        }

        function updatePrices(dom, start) {

            let nodes = dom.querySelectorAll(".market_listing_row");
            for (let node of nodes) {
                if (node.id) {
                    if (transactions.has(node.id)) {
                        // Duplicate transaction, don't count in totals twice.
                        continue;
                    } else {
                        transactions.add(node.id);
                    }
                } else {
                    console.error('Could not find id of transaction', node);
                }
                let type = node.querySelector(".market_listing_gainorloss").textContent;
                let isPurchase;
                if (type.includes("+")) {
                    isPurchase = true;
                } else if (type.includes("-")) {
                    isPurchase = false;
                } else {
                    continue;
                }
                if (!curStartListing && start === 0) {
                    curStartListing = node.id;
                }
                // If reached cached data, then stop.
                if (node.id === startListing) {
                    stop = true;
                    break;
                }

                let priceNode = node.querySelector(".market_listing_price");
                if (!priceNode) { continue; }

                let price = Price.parseFromString(priceNode.textContent);

                if (isPurchase) {
                    purchaseTotal += price.value;
                } else {
                    saleTotal += price.value;
                }
            }

            let net = new Price(saleTotal - purchaseTotal);
            let color = "green";
            let netText = Localization.str.net_gain;
            if (net.value < 0) {
                color = "red";
                netText = Localization.str.net_spent;
            }

            let purchaseTotalPrice = new Price(purchaseTotal);
            let saleTotalPrice = new Price(saleTotal);
            HTML.inner(
                "#es_market_summary",
                `<div>${Localization.str.purchase_total} <span class='es_market_summary_item'>${purchaseTotalPrice}</span></div>
                <div>${Localization.str.sales_total} <span class='es_market_summary_item'>${saleTotalPrice}</span></div>
                <div>${netText}<span class='es_market_summary_item' style="color:${color}">${net}</span></div>`
            );
        }

        const pageSize = 500;
        let pages = -1;
        let currentPage = 0;
        let totalCount = null;
        let pageRequests = [];
        let failedRequests = 0;

        let progressNode = document.querySelector("#esi_market_stats_progress");
        let url = new URL("/market/myhistory/render/", "https://steamcommunity.com/");
        url.searchParams.set('count', pageSize);

        async function nextRequest() {
            let request = pageRequests.shift();
            url.searchParams.set('start', request.start);
            request.attempt += 1;
            request.lastAttempt = Date.now();
            if (request.attempt > 1) {
                await sleep(2000);
            } else if (request.attempt > 4) {
                // Give up after four tries
                throw new Error("Could not retrieve market transactions.");
            }
            
            let data = await RequestData.getJson(url.toString());
            let dom = HTMLParser.htmlToDOM(data.results_html);

            // Request may fail with results_html == "\t\t\t\t\t\t<div class=\"market_listing_table_message\">There was an error loading your market history. Please try again later.</div>\r\n\t"
            let message = dom.querySelector('.market_listing_table_message');
            if (message && message.textContent.includes("try again later")) {
                pageRequests.push(request);
                failedRequests += 1;
                return;
            }
            
            updatePrices(dom, request.start);

            return data.total_count;
        }

        try {
            pageRequests.push({ 'start': 0, 'attempt': 0, 'lastAttempt': 0, });
            while (pageRequests.length > 0 && !stop) {
                let t = await nextRequest();
                if (pages < 0 && t > 0) {
                    totalCount = t;
                    pages = Math.ceil(totalCount / pageSize);
                    for (let start = pageSize; start < totalCount; start += pageSize) {
                        pageRequests.push({ 'start': start, 'attempt': 0, 'lastAttempt': 0, });
                    }
                }

                progressNode.textContent = `${++currentPage}${failedRequests > 0 ? -failedRequests : ''}/${pages < 0 ? "?" : pages} (${transactions.size}/${totalCount})`;
            }
        } catch (err) {
            failedRequests += 1;
            console.error(err);
        }

        if (failedRequests === 0) {
            progressNode.textContent = '';
            LocalStorage.set("market_stats", { startListing: curStartListing, purchaseTotal, saleTotal });
            return true;
        }

        progressNode.textContent = Localization.str.transactionStatus.replace("__failed__", failedRequests).replace("__size__", transactions.size).replace("__total__", totalCount);
        return false;
    }
}
