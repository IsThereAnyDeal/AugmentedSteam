import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, CurrencyManager, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FQuickSellOptions extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory && SyncedStorage.get("quickinv");
    }

    async callback({
        view,
        sessionId,
        marketAllowed,
        assetId,
        contextId,
        globalId,
        walletCurrency,
        marketable,
        hashName,
        publisherFee
    }) {

        // Additional checks for market eligibility, see https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L3675
        if (!marketAllowed || (walletCurrency === 0) || !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);
        const diff = SyncedStorage.get("quickinv_diff");

        // marketActions' innerHTML is cleared on item selection, so the links HTML has to be re-inserted
        HTML.beforeEnd(marketActions,
            this._makeMarketButton(`es_quicksell${view}`, Localization.str.quick_sell_desc.replace("__modifier__", diff))
            + this._makeMarketButton(`es_instantsell${view}`, Localization.str.instant_sell_desc)
            + '<div class="es_qsell_loading"></div>');

        Page.runInPageContext(view => {
            window.SteamFacade.vTooltip(`#es_quicksell${view}, #es_instantsell${view}`);
        }, [view]);

        // Check if price is stored in data
        if (!thisItem.dataset.priceLow) {
            if (thisItem.classList.contains("es_prices_loading")) { return; }
            thisItem.classList.add("es_prices_loading");

            thisItem.dataset.priceLow = "nodata";
            thisItem.dataset.priceHigh = "nodata";

            // Get item_nameid of selected item, which can only be found on the item's marketlistings page
            const result = await RequestData.getHttp(`https://steamcommunity.com/market/listings/${globalId}/${encodeURIComponent(hashName)}`);

            const m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);

            if (m) {
                await this._fillInPrices(m[1], thisItem.dataset, walletCurrency, diff);
            }

            thisItem.classList.remove("es_prices_loading");
        }

        // Add data and bind actions to the button if selected item is active
        if (!thisItem.classList.contains("activeInfo")) { return; }

        const quickSell = document.getElementById(`es_quicksell${view}`);
        const instantSell = document.getElementById(`es_instantsell${view}`);

        const priceHighValue = Number(thisItem.dataset.priceHigh) || 0;
        const priceLowValue = Number(thisItem.dataset.priceLow) || 0;

        const currencyType = CurrencyManager.currencyNumberToType(walletCurrency);

        // Show Quick Sell button
        if (priceHighValue && priceHighValue > priceLowValue) {
            const formattedPrice = await Page.runInPageContext(
                (price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceHighValue, currencyType], true
            );

            quickSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.quick_sell.replace("__amount__", formattedPrice);
            quickSell.dataset.price = priceHighValue;
            quickSell.style.display = "block";
        }

        // Show Instant Sell button
        if (priceLowValue) {
            const formattedPrice = await Page.runInPageContext(
                (price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceLowValue, currencyType], true
            );

            instantSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.instant_sell.replace("__amount__", formattedPrice);
            instantSell.dataset.price = priceLowValue;
            instantSell.style.display = "block";
        }

        function enableButtons(enable) {
            for (const button of marketActions.querySelectorAll(".item_market_action_button")) {
                button.classList[enable ? "remove" : "add"]("btn_disabled");
                button.style.pointerEvents = enable ? "" : "none";
            }
        }

        const loadingEl = marketActions.querySelector(".es_qsell_loading");

        async function clickHandler(e) {
            e.preventDefault();

            enableButtons(false);

            HTML.inner(loadingEl,
                `<div class="es_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${Localization.str.selling}</span>
                </div>`);

            const feeInfo = await Page.runInPageContext((price, fee) => {
                return window.SteamFacade.calculateFeeAmount(price, fee);
            }, [e.currentTarget.dataset.price, publisherFee], true);

            const sellPrice = feeInfo.amount - feeInfo.fees;

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4268
            const formData = new FormData();
            formData.append("sessionid", sessionId);
            formData.append("appid", globalId);
            formData.append("contextid", contextId);
            formData.append("assetid", assetId);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            const result = await RequestData.post("https://steamcommunity.com/market/sellitem/", formData, {}, true).catch(err => err);

            if (!result?.success) {
                HTML.inner(loadingEl, result?.message ?? Localization.str.error);
                enableButtons(true);

                return;
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4368
            if (result.requires_confirmation) {
                HTML.inner(loadingEl, Localization.str.quick_sell_verify);
            } else {
                marketActions.style.display = "none";
            }

            document.getElementById(`iteminfo${view}_item_scrap_actions`).style.display = "none";

            thisItem.classList.add("btn_disabled", "activeInfo");
            thisItem.style.pointerEvents = "none";
        }

        quickSell.addEventListener("click", clickHandler);
        instantSell.addEventListener("click", clickHandler);
    }

    async _fillInPrices(itemNameId, dataset, walletCurrency, diff) {
        const data = await RequestData.getJson(`https://steamcommunity.com/market/itemordershistogram?language=english&currency=${walletCurrency}&item_nameid=${itemNameId}`);

        if (data && data.success) {

            if (data.highest_buy_order) {
                dataset.priceLow = data.highest_buy_order;
            }

            if (data.lowest_sell_order) {
                let priceHigh = parseFloat(data.lowest_sell_order / 100) + parseFloat(diff);
                priceHigh = Math.max(priceHigh, 0.03);

                dataset.priceHigh = priceHigh.toFixed(2) * 100;
            }
        }
    }

    _makeMarketButton(id, tooltip) {
        return `<a class="item_market_action_button item_market_action_button_green" id="${id}" data-tooltip-text="${tooltip}" style="display: none;">
                    <span class="item_market_action_button_edge item_market_action_button_left"></span>
                    <span class="item_market_action_button_contents"></span>
                    <span class="item_market_action_button_edge item_market_action_button_right"></span>
                    <span class="item_market_action_button_preload"></span>
                </a>`;
    }
}
