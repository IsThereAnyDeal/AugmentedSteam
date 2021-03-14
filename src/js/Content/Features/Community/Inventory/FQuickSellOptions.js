import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature, CurrencyManager, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

// TODO Support non-Steam items
export default class FQuickSellOptions extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory && SyncedStorage.get("quickinv");
    }

    async callback({
        view,
        sessionId,
        assetId,
        contextId,
        globalId,
        walletCurrency,
        marketable,
        hashName,
        publisherFee
    }) {

        if (!marketable || contextId !== 6 || globalId !== 753) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);
        const diff = SyncedStorage.get("quickinv_diff");

        // marketActions' innerHTML is cleared on item selection, so the links HTML has to be re-inserted
        HTML.beforeEnd(marketActions,
            this._makeMarketButton(`es_quicksell${view}`, Localization.str.quick_sell_desc.replace("__modifier__", diff))
            + this._makeMarketButton(`es_instantsell${view}`, Localization.str.instant_sell_desc));

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
                const data = await RequestData.getJson(`https://steamcommunity.com/market/itemordershistogram?language=english&currency=${walletCurrency}&item_nameid=${m[1]}`);

                if (data && data.success) {

                    if (data.highest_buy_order) {
                        thisItem.dataset.priceLow = data.highest_buy_order;
                    }

                    if (data.lowest_sell_order) {
                        let priceHigh = parseFloat(data.lowest_sell_order / 100) + parseFloat(diff);
                        if (priceHigh < 0.03) {
                            priceHigh = 0.03;
                        }

                        thisItem.dataset.priceHigh = priceHigh.toFixed(2) * 100;
                    }
                }
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
            const formattedPrice = await Page.runInPageContext((price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceHighValue, currencyType], true);

            quickSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.quick_sell.replace("__amount__", formattedPrice);
            quickSell.dataset.price = priceHighValue;
            quickSell.style.display = "block";
        }

        // Show Instant Sell button
        if (priceLowValue) {
            const formattedPrice = await Page.runInPageContext((price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceLowValue, currencyType], true);

            instantSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.instant_sell.replace("__amount__", formattedPrice);
            instantSell.dataset.price = priceLowValue;
            instantSell.style.display = "block";
        }

        async function clickHandler(e) {
            e.preventDefault();

            const buttonParent = e.target.closest(".item_market_action_button[data-price]");
            if (!buttonParent) { return; }

            for (const button of [quickSell, instantSell]) {
                button.classList.add("btn_disabled");
                button.style.pointerEvents = "none";
            }

            HTML.inner(marketActions.querySelector("div"),
                `<div class="es_loading" style="min-height: 66px;">
                    <img src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">
                    <span>${Localization.str.selling}</span>
                </div>`);

            const feeInfo = await Page.runInPageContext((price, fee) => {
                return window.SteamFacade.calculateFeeAmount(price, fee);
            }, [buttonParent.dataset.price, publisherFee], true);

            const sellPrice = feeInfo.amount - feeInfo.fees;

            const formData = new FormData();
            formData.append("sessionid", sessionId);
            formData.append("appid", globalId);
            formData.append("contextid", contextId);
            formData.append("assetid", assetId);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            await RequestData.post("https://steamcommunity.com/market/sellitem/", formData);

            marketActions.style.display = "none";
            document.getElementById(`iteminfo${view}_item_scrap_actions`).style.display = "none";

            thisItem.classList.add("btn_disabled", "activeInfo");
            thisItem.style.pointerEvents = "none";
        }

        quickSell.addEventListener("click", clickHandler);
        instantSell.addEventListener("click", clickHandler);
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
