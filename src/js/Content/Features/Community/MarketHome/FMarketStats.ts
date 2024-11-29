import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import TimeUtils from "@Core/Utils/TimeUtils";
import Settings from "@Options/Data/Settings";
import {
    __loading,
    __loadMarketStats,
    __marketTransactions,
    __netGain,
    __netSpent,
    __purchaseTotal,
    __salesTotal,
    __transactionStatus,
} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import LocalStorage from "@Core/Storage/LocalStorage";
import RequestData from "@Content/Modules/RequestData";
import Price from "@Content/Modules/Currency/Price";

export default class FMarketStats extends Feature<CMarketHome> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn;
    }

    override apply(): void {

        HTML.beforeBegin("#findItems",
            `<div id="es_summary">
                <div class="market_search_sidebar_contents">
                    <h2 class="market_section_title">${L(__marketTransactions)}</h2>
                    <div id="es_market_summary_status">
                        <a class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button">
                            <span>${L(__loadMarketStats)}</span>
                        </a>
                    </div>
                </div>
            </div>`);

        document.getElementById("es_market_summary_button")!
            .addEventListener("click", () => this._startLoading());

        if (Settings.showmarkettotal) {
            this._startLoading();
        }
    }

    async _startLoading(): Promise<void> {

        const statusNode = document.getElementById("es_market_summary_status")!;

        HTML.inner(statusNode,
            `<img id="es_market_summary_throbber" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
            <span>
                <span id="esi_market_stats_progress_description">${L(__loading)} </span>
                <span id="esi_market_stats_progress"></span>
            </span>`);

        HTML.afterEnd(statusNode, '<div class="market_search_game_button_group" id="es_market_summary"></div>');

        if (await this._load()) {
            statusNode.remove();
        } else {
            document.getElementById("es_market_summary_throbber")!.remove();
            document.getElementById("esi_market_stats_progress_description")!.remove();
        }
    }

    async _load() {

        const marketStats = (await LocalStorage.get("market_stats")) ?? {
            startListing: null,
            purchaseTotal: 0,
            saleTotal: 0
        };
        let {startListing, purchaseTotal, saleTotal} = marketStats;

        let curStartListing: string|null = null;
        const transactions = new Set();
        let stop = false;

        // If startListing is missing, reset cached data to avoid inaccurate results.
        if (startListing === null && (purchaseTotal > 0 || saleTotal > 0)) { // TODO when is startListing `null`?
            purchaseTotal = 0;
            saleTotal = 0;
        }

        function updatePrices(dom: DocumentFragment, start: number): void {

            const nodes = dom.querySelectorAll(".market_listing_row");
            for (const node of nodes) {
                if (node.id) {
                    if (transactions.has(node.id)) {

                        // Duplicate transaction, don't count in totals twice.
                        continue;
                    } else {
                        transactions.add(node.id);
                    }
                } else {
                    console.error("Could not find id of transaction", node); // TODO are there any implications?
                }

                const type = node.querySelector(".market_listing_gainorloss")?.textContent;
                if (!type) {
                    continue;
                }

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

                // Stop when cached data is reached.
                if (node.id === startListing) {
                    stop = true;
                    break;
                }

                const priceNode = node.querySelector(".market_listing_price");
                if (!priceNode || !priceNode.textContent) { continue; }

                const price = Price.parseFromString(priceNode.textContent);

                if (price) {
                    if (isPurchase) {
                        purchaseTotal += price.value;
                    } else {
                        saleTotal += price.value;
                    }
                }
            }

            const net = new Price(saleTotal - purchaseTotal);
            let color = "green";
            let netText = L(__netGain);
            if (net.value < 0) {
                color = "red";
                netText = L(__netSpent);
            }

            const purchaseTotalPrice = new Price(purchaseTotal);
            const saleTotalPrice = new Price(saleTotal);
            HTML.inner("#es_market_summary",
                `<div>
                    ${L(__purchaseTotal)}
                    <span class="es_market_summary_item">${purchaseTotalPrice}</span>
                </div>
                <div>
                    ${L(__salesTotal)}
                    <span class="es_market_summary_item">${saleTotalPrice}</span>
                </div>
                <div>
                    ${netText}
                    <span class="es_market_summary_item" style="color: ${color};">${net}</span>
                </div>`);
        }

        const pageSize = 500; // Max number of transactions Steam allows to fetch per request
        let pages = -1;
        let currentPage = 0;
        let totalCount = null;
        const pageRequests: Array<{
            start: number,
            attempt: number,
            lastAttempt: number
        }> = [];
        let failedRequests = 0;

        const progressNode = document.querySelector<HTMLElement>("#esi_market_stats_progress")!;
        const url = new URL("/market/myhistory/render/", "https://steamcommunity.com/");
        url.searchParams.set("count", String(pageSize));

        async function nextRequest() {
            const request = pageRequests.shift();
            if (!request) {
                return null
            }

            url.searchParams.set("start", String(request.start));
            request.attempt += 1;
            request.lastAttempt = Date.now(); // TODO this field is set but never read
            if (request.attempt > 1) {
                await TimeUtils.timer(2000);
            } else if (request.attempt > 4) {

                // Give up after four tries
                throw new Error(`Failed to load market history page ${url}`);
            }

            const data = await RequestData.getJson<{
                results_html: string,
                total_count: number
            }>(url.toString());
            const dom = HTML.toDom(data.results_html); // TODO use DOMParser since there's no need to sanitize?

            /*
             * Request may fail with results_html === "\t\t\t\t\t\t<div class=\"market_listing_table_message\">
             * There was an error loading your market history. Please try again later.</div>\r\n\t"
             * Note the error message is localized!
             */
            if (dom.querySelector(".market_listing_table_message") !== null) {
                pageRequests.push(request);
                failedRequests += 1; // TODO what if this request succeeds in later attempts?
                return null; // TODO change the return type to avoid implicit conversions on line 189 ?
            }

            updatePrices(dom, request.start);

            return data.total_count;
        }

        try {
            pageRequests.push({
                start: 0,
                attempt: 0,
                lastAttempt: 0
            });

            /*
             * TODO this should be rewritten, this disable here is not necessary. Also functions should be split,
             *  they are intervowen between regular code
             */
            while (pageRequests.length > 0 && !stop) {
                const t = await nextRequest();
                if (t !== null && pages < 0 && t > 0) {
                    totalCount = t;
                    pages = Math.ceil(totalCount / pageSize);
                    for (let start = pageSize; start < totalCount; start += pageSize) {
                        pageRequests.push({
                            start,
                            attempt: 0,
                            lastAttempt: 0
                        });
                    }
                }

                progressNode.textContent = `${++currentPage}${failedRequests > 0 ? -failedRequests : ""}/${pages < 0 ? "?" : pages} (${transactions.size}/${totalCount})`;
            }
        } catch (err) {
            failedRequests += 1;
            console.error(err);
        }

        if (failedRequests === 0) {
            progressNode.textContent = "";
            LocalStorage.set("market_stats", {
                startListing: curStartListing,
                purchaseTotal,
                saleTotal
            });
            return true;
        }

        /**
         * TODOs to consider
         * 1. Store failed ranges separately so they can be retried later, and/or add a "refresh" button to recalculate from scratch
         * 2. After testing, Steam starts throwing 429s after 30 requests (30 * 500 = 15000 items), sometimes earlier.
         *  Add a "continue" button to allow continuing where we left off.
         */
        progressNode.textContent = L(__transactionStatus, {
            failed: failedRequests,
            size: transactions.size,
            total: String(totalCount)
        });
        return false;
    }
}
