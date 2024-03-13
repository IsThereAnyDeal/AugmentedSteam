import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, CurrencyManager, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FQuickSellOptions extends CallbackFeature {

    constructor(context) {
        super(context);

        this._loadedMarketPrices = {};
    }

    checkPrerequisites() {
        return this.context.myInventory && SyncedStorage.get("quickinv");
    }

    async callback({
        view,
        sessionId,
        marketAllowed,
        country,
        assetId,
        contextId,
        globalId,
        walletCurrency,
        marketable,
        hashName,
        publisherFee,
        lowestListingPrice
    }) {

        // Additional checks for market eligibility, see https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L3675
        if (!marketAllowed || (walletCurrency === 0) || !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);
        const diff = SyncedStorage.get("quickinv_diff");

        // marketActions' innerHTML is cleared on item selection, so the links HTML has to be re-inserted
        HTML.beforeEnd(marketActions,
            `<div class="es_qsell_ctn">
                <a class="btn_small btn_grey_white_innerfade" id="es_quicksell${view}" data-tooltip-text="${Localization.str.quick_sell_desc.replace("__modifier__", diff)}">
                    <span></span>
                </a>
                <a class="btn_small btn_grey_white_innerfade" id="es_instantsell${view}" data-tooltip-text="${Localization.str.instant_sell_desc}">
                    <span></span>
                </a>
                <div class="es_loading es_qsell_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${Localization.str.selling}</span>
                </div>
            </div>`);

        // Steam's mutation observer for tooltips is disabled on inventories, so add them manually
        Page.runInPageContext(view => {
            window.SteamFacade.vTooltip(`#es_quicksell${view}, #es_instantsell${view}`);
        }, [view]);

        // Check if price is stored in data
        if (!thisItem.dataset.priceLow) {
            if (thisItem.classList.contains("es_prices_loading")) { return; }
            thisItem.classList.add("es_prices_loading");

            let {priceLow = 0, priceHigh = 0} = this._loadedMarketPrices[hashName]
                || await this._getMarketPrices(globalId, country, walletCurrency, hashName).catch(() => null)
                || {};

            if (priceHigh > 0) {
                priceHigh = Math.max((priceHigh / 100) + parseFloat(diff), lowestListingPrice) || 0;
                priceHigh = priceHigh.toFixed(2) * 100;
            }

            thisItem.dataset.priceLow = priceLow;
            thisItem.dataset.priceHigh = priceHigh;

            thisItem.classList.remove("es_prices_loading");
        }

        // Add data and bind actions to the button if selected item is active
        if (!thisItem.classList.contains("activeInfo")) { return; }

        const quickSell = document.getElementById(`es_quicksell${view}`);
        const instantSell = document.getElementById(`es_instantsell${view}`);
        const loadingEl = marketActions.querySelector(".es_qsell_loading");

        const priceHighValue = Number(thisItem.dataset.priceHigh);
        const priceLowValue = Number(thisItem.dataset.priceLow);

        const currencyType = CurrencyManager.currencyNumberToType(walletCurrency);

        function enableButtons(enable) {
            for (const button of marketActions.querySelectorAll(".item_market_action_button, .btn_small")) {
                button.classList.toggle("btn_disabled", !enable);
            }
        }

        async function clickHandler(e) {
            e.preventDefault();

            enableButtons(false);
            loadingEl.style.display = "block";

            const feeInfo = await Page.runInPageContext((price, fee) => {
                return window.SteamFacade.calculateFeeAmount(price, fee);
            }, [e.currentTarget.dataset.price, publisherFee], true);

            const sellPrice = feeInfo.amount - feeInfo.fees;

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4268
            const data = {
                "sessionid": sessionId,
                "appid": globalId,
                "contextid": contextId,
                "assetid": assetId,
                "amount": 1, // TODO support stacked items, e.g. sack of gems
                "price": sellPrice
            };

            const result = await RequestData.post("https://steamcommunity.com/market/sellitem/", data).catch(err => err);

            if (!result?.success) {
                loadingEl.textContent = result?.message ?? Localization.str.error;
                enableButtons(true);

                return;
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4368
            if (result.requires_confirmation) {
                loadingEl.textContent = Localization.str.quick_sell_verify;
            } else {
                marketActions.style.display = "none";
            }

            document.getElementById(`iteminfo${view}_item_scrap_actions`).style.display = "none";

            thisItem.classList.add("btn_disabled", "activeInfo");
        }

        // Show Quick Sell button
        if (priceHighValue > 0 && priceHighValue > priceLowValue) {
            this._showSellButton(quickSell, Localization.str.quick_sell, priceHighValue, currencyType, clickHandler);
        }

        // Show Instant Sell button
        if (priceLowValue > 0) {
            this._showSellButton(instantSell, Localization.str.instant_sell, priceLowValue, currencyType, clickHandler);
        }
    }

    _getMarketPrices(globalId, country, walletCurrency, hashName) {

        // Get item_nameid of selected item, which can only be found on the item's market listings page
        return RequestData.getHttp(`https://steamcommunity.com/market/listings/${globalId}/${encodeURIComponent(hashName)}`).then(result => {
            const m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);
            if (!m) {
                console.error("Failed to get nameId for item '%s'", hashName);
                return null;
            }

            return RequestData.getJson(`https://steamcommunity.com/market/itemordershistogram?country=${country}&language=english&currency=${walletCurrency}&item_nameid=${m[1]}`).then(data => {
                if (!data || !data.success) {
                    console.error("Failed to get market prices for item '%s'", hashName);
                    return null;
                }

                const prices = {
                    "priceLow": Number(data.highest_buy_order),
                    "priceHigh": Number(data.lowest_sell_order)
                };

                this._loadedMarketPrices[hashName] = prices;
                return prices;
            });
        });
    }

    async _showSellButton(buttonEl, buttonStr, priceVal, currencyType, clickHandler) {
        const formattedPrice = await Page.runInPageContext(
            (price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceVal, currencyType], true
        );

        buttonEl.querySelector("span").textContent = buttonStr.replace("__amount__", formattedPrice);
        buttonEl.dataset.price = priceVal;
        buttonEl.style.display = "block";
        buttonEl.addEventListener("click", clickHandler);
    }
}
