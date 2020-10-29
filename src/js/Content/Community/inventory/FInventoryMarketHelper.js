import {GameId, HTML, HTMLParser, Localization, SyncedStorage} from "../../../core_modules";
import {
    Background, CurrencyManager,
    Feature, Messenger, Price, RequestData, User
} from "../../../Modules/content";
import {Page} from "../../Page";

// TODO Split this up
export default class FInventoryMarketHelper extends Feature {

    apply() {

        Page.runInPageContext(() => {

            /* eslint-disable no-undef, camelcase */
            $J(document).on("click", ".inventory_item_link, .newitem", () => {
                if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
                    g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name;
                }
                let market_expired = false;
                if (g_ActiveInventory.selectedItem.description) {
                    market_expired = g_ActiveInventory.selectedItem.description.descriptions.reduce(
                        (acc, el) => (acc || el.value === "This item can no longer be bought or sold on the Community Market."),
                        false,
                    );
                }

                window.Messenger.postMessage("sendMessage", [
                    iActiveSelectView,
                    g_ActiveInventory.selectedItem.description.marketable,
                    g_ActiveInventory.appid,
                    g_ActiveInventory.selectedItem.description.market_hash_name,
                    g_ActiveInventory.selectedItem.description.type,
                    g_ActiveInventory.selectedItem.assetid,
                    g_sessionID,
                    g_ActiveInventory.selectedItem.contextid,
                    g_rgWalletInfo.wallet_currency,
                    g_ActiveInventory.m_owner.strSteamId,
                    g_ActiveInventory.selectedItem.description.market_marketable_restriction,
                    market_expired
                ]);
            });
            /* eslint-enable no-undef, camelcase */
        });

        Messenger.addMessageListener("sendMessage", info => { this._inventoryMarketHelper(info); });

        Messenger.addMessageListener("sendFee", async({
            feeInfo,
            "sessionID": sessionId,
            "global_id": globalId,
            "contextID": contextId,
            "assetID": assetId,
        }) => {
            const sellPrice = feeInfo.amount - feeInfo.fees;
            const formData = new FormData();
            formData.append("sessionid", sessionId);
            formData.append("appid", globalId);
            formData.append("contextid", contextId);
            formData.append("assetid", assetId);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            /*
             * TODO test what we need to send in request, this is original:
             * mode: "cors", // CORS to cover requests sent from http://steamcommunity.com
             * credentials: "include",
             * headers: { origin: window.location.origin },
             * referrer: window.location.origin + window.location.pathname
             */

            await RequestData.post("https://steamcommunity.com/market/sellitem/", formData, {"withCredentials": true});

            document.querySelector(`#es_instantsell${assetId}`).parentNode.style.display = "none";

            const node = document.querySelector(`[id="${globalId}_${contextId}_${assetId}"]`);
            node.classList.add("btn_disabled", "activeInfo");
            node.style.pointerEvents = "none";
        });
    }

    _inventoryMarketHelper([
        item,
        marketable,
        globalId,
        hashName,
        assetType,
        assetId,
        sessionId,
        contextId,
        walletCurrency,
        ownerSteamId,
        restriction,
        expired
    ]) {

        const _marketable = parseInt(marketable);
        const _globalId = parseInt(globalId);
        const _contextId = parseInt(contextId);
        const _restriction = parseInt(restriction);
        const isGift = assetType && /Gift/i.test(assetType);
        const isBooster = hashName && /Booster Pack/i.test(hashName);
        const ownsInventory = User.isSignedIn && (ownerSteamId === User.steamId);

        const hm = hashName.match(/^([0-9]+)-/);
        const appid = hm ? hm[1] : null;

        const thisItem = document.querySelector(`[id="${_globalId}_${_contextId}_${assetId}"]`);
        const itemActions = document.querySelector(`#iteminfo${item}_item_actions`);
        const marketActions = document.querySelector(`#iteminfo${item}_item_market_actions`);
        marketActions.style.overflow = "hidden";

        // Set as background option
        if (ownsInventory) {
            this._setBackgroundOption(thisItem, assetId, itemActions);
        }

        // Show prices for gifts
        if (isGift) {
            this._addPriceToGifts(itemActions);
            return;
        }

        if (ownsInventory) {

            // If is a booster pack add the average price of three cards
            if (isBooster) {
                this._addBoosterPackProgress(item, appid);
            }

            this._addOneClickGemsOption(item, appid, assetId);
            this._addQuickSellOptions(
                marketActions,
                thisItem,
                _marketable,
                _contextId,
                _globalId,
                assetId,
                sessionId,
                walletCurrency
            );
        }

        if ((ownsInventory && _restriction > 0 && !_marketable && !expired && hashName !== "753-Gems") || _marketable) {
            this._showMarketOverview(thisItem, marketActions, _globalId, hashName, appid, isBooster, walletCurrency);
        }
    }

    _setBackgroundOption(thisItem, assetId, itemActions) {

        if (!document.querySelector(".inventory_links")) { return; }
        if (itemActions.querySelector(".es_set_background")) { return; }

        const viewFullBtn = itemActions.querySelector("a");
        if (!viewFullBtn) { return; }

        if (!/public\/images\/items/.test(viewFullBtn.href)) { return; }

        const linkClass = thisItem.classList.contains("es_isset_background") ? "btn_disabled" : "";
        HTML.afterEnd(viewFullBtn,
            `<a class="es_set_background btn_small btn_darkblue_white_innerfade ${linkClass}">
                <span>${Localization.str.set_as_background}</span>#
            </a>
            <img class="es_background_loading" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">`);

        HTML.afterEnd(viewFullBtn,
            viewFullBtn);

        viewFullBtn.parentNode.querySelector(".es_set_background").addEventListener("click", async e => {
            e.preventDefault();
            const el = e.target.closest(".es_set_background");

            if (el.classList.contains("btn_disabled")) { return; }

            const loading = viewFullBtn.parentNode.querySelector(".es_background_loading");
            if (loading.classList.contains("esi-shown")) { return; }

            loading.classList.add("esi-shown");

            // Do nothing if loading or already done
            const setBackground = document.querySelector(".es_isset_background");
            if (setBackground) {
                setBackground.classList.remove("es_isset_background");
            }
            thisItem.classList.add("es_isset_background");

            const result = await RequestData.getHttp(`${User.profileUrl}/edit`);

            // Make sure the background we are trying to set is not set already
            const m = result.match(/SetCurrentBackground\( {"communityitemid":"(\d+)"/i);
            const currentBg = m ? m[1] : false;

            if (currentBg === assetId) {
                el.classList.add("btn_disabled");
                loading.classList.remove("esi-shown");
            } else {
                const dom = HTMLParser.htmlToDOM(result);

                dom.querySelector("#profile_background").value = assetId;
                const form = dom.querySelector("#editForm");
                const formData = new FormData(form);

                RequestData.post(`${User.profileUrl}/edit`, formData, {"withCredentials": true}).then(result => {

                    // Check if it was truly a succesful change
                    if (/"saved_changes_msg"/i.test(result)) {
                        el.classList.add("btn_disabled");
                    }
                })
                    .catch(() => {
                        console.error("Edit background failed");
                    })
                    .finally(() => {
                        loading.classList.remove("esi-shown");
                    });
            }
        });
    }

    async _addPriceToGifts(itemActions) {

        const action = itemActions.querySelector("a");
        if (!action) { return; }

        const giftAppid = GameId.getAppid(action.href);
        if (!giftAppid) { return; }

        // TODO: Add support for package(sub)

        const result = await Background.action("appdetails", giftAppid, "price_overview");
        if (!result || !result.success) { return; }

        const overview = result.data.price_overview;
        if (!overview) { return; }

        const discount = overview.discount_percent;
        const price = new Price(overview.final / 100, overview.currency);

        itemActions.style.display = "flex";
        itemActions.style.alignItems = "center";
        itemActions.style.justifyContent = "space-between";

        if (discount > 0) {
            const originalPrice = new Price(overview.initial / 100, overview.currency);
            HTML.beforeEnd(itemActions,
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_discount_block es_game_purchase_discount'>
                            <div class='es_discount_pct'>-${discount}%</div>
                            <div class='es_discount_prices'>
                                <div class='es_discount_original_price'>${originalPrice}</div>
                                <div class='es_discount_final_price'>${price}</div>
                            </div>
                        </div>
                    </div>
                </div>`);
        } else {
            HTML.beforeEnd(itemActions,
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_game_purchase_price es_price'>${price}</div>
                    </div>
                </div>`);
        }
    }

    _addBoosterPackProgress(item, appid) {
        HTML.afterBegin(`#iteminfo${item}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="https://steamcommunity.com/my/gamecards/${appid}/"><span>${Localization.str.view_badge_progress}</span></a>`);
    }

    _addOneClickGemsOption(item, appid, assetid) {
        if (!SyncedStorage.get("show1clickgoo")) { return; }

        const quickGrind = document.querySelector("#es_quickgrind");
        if (quickGrind) { quickGrind.parentNode.remove(); }

        const scrapActions = document.querySelector(`#iteminfo${item}_item_scrap_actions`);

        const divs = scrapActions.querySelectorAll("div");
        HTML.beforeBegin(divs[divs.length - 1],
            `<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind'><span>${Localization.str.oneclickgoo}</span></div>`);

        // TODO: Add prompt?
        document.querySelector("#es_quickgrind").addEventListener("click", () => {
            Page.runInPageContext((appid, assetid) => {
                /* eslint-disable no-undef, new-cap, camelcase */
                const rgAJAXParams = {
                    "sessionid": g_sessionID,
                    appid,
                    assetid,
                    "contextid": 6
                };

                let strActionURL = `${g_strProfileURL}/ajaxgetgoovalue/`;

                $J.get(strActionURL, rgAJAXParams).done(data => {
                    strActionURL = `${g_strProfileURL}/ajaxgrindintogoo/`;
                    rgAJAXParams.goo_value_expected = data.goo_value;

                    $J.post(strActionURL, rgAJAXParams).done(() => {
                        ReloadCommunityInventory();
                    });
                });
                /* eslint-enable no-undef, new-cap, camelcase */
            }, [appid, assetid]);
        });
    }

    async _addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency) {
        if (!SyncedStorage.get("quickinv")) { return; }
        if (!marketable) { return; }
        if (contextId !== 6 || globalId !== 753) { return; }

        /*
         * 753 is the appid for "Steam" in the Steam Inventory
         * 6 is the context used for "Community Items"; backgrounds, emoticons and trading cards
         */

        if (!thisItem.classList.contains("es-loading")) {
            const url = marketActions.querySelector("a").href;

            thisItem.classList.add("es-loading");

            // Add the links with no data, so we can bind actions to them, we add the data later
            const diff = SyncedStorage.get("quickinv_diff");
            HTML.beforeEnd(marketActions, this._makeMarketButton(`es_quicksell${assetId}`, Localization.str.quick_sell_desc.replace("__modifier__", diff)));
            HTML.beforeEnd(marketActions, this._makeMarketButton(`es_instantsell${assetId}`, Localization.str.instant_sell_desc));

            // eslint-disable-next-line no-undef, new-cap
            Page.runInPageContext(() => { SetupTooltips({"tooltipCSSClass": "community_tooltip"}); });

            // Check if price is stored in data
            if (thisItem.classList.contains("es-price-loaded")) {
                const priceHighValue = thisItem.dataset.priceHigh;
                const priceLowValue = thisItem.dataset.priceLow;

                this._updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency);
            } else {
                const result = await RequestData.getHttp(url);

                const m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);

                if (m) {
                    const marketId = m[1];

                    const marketUrl = `https://steamcommunity.com/market/itemordershistogram?language=english&currency=${walletCurrency}&item_nameid=${marketId}`;
                    const market = await RequestData.getJson(marketUrl);

                    let priceHigh = parseFloat(market.lowest_sell_order / 100) + parseFloat(diff);
                    const priceLow = market.highest_buy_order / 100;

                    // priceHigh.currency == priceLow.currency == Currency.customCurrency, the arithmetic here is in walletCurrency

                    if (priceHigh < 0.03) { priceHigh = 0.03; }

                    // Store prices as data
                    if (priceHigh > priceLow) {
                        thisItem.dataset.priceHigh = priceHigh;
                    }
                    if (market.highest_buy_order) {
                        thisItem.dataset.priceLow = priceLow;
                    }

                    // Fixes multiple buttons
                    if (document.querySelector(".item.activeInfo") === thisItem) {
                        this._updateMarketButtons(assetId, priceHigh, priceLow, walletCurrency);
                    }

                    thisItem.classList.add("es-price-loaded");
                }
            }

            // Loading request either succeeded or failed, no need to flag as still in progress
            thisItem.classList.remove("es-loading");
        }

        // Bind actions to "Quick Sell" and "Instant Sell" buttons

        const nodes = document.querySelectorAll(`#es_quicksell${assetId}, #es_instantsell${assetId}`);
        for (const node of nodes) {
            // eslint-disable-next-line no-loop-func -- Only CalculateFeeAmount is accessed, which isn't an unsafe reference
            node.addEventListener("click", (e) => {
                e.preventDefault();

                const buttonParent = e.target.closest(".item_market_action_button[data-price]");
                if (!buttonParent) { return; }

                const sellPrice = buttonParent.dataset.price * 100;

                const buttons = document.querySelectorAll(`#es_quicksell${assetId}, #es_instantsell${assetId}`);
                for (const button of buttons) {
                    button.classList.add("btn_disabled");
                    button.style.pointerEvents = "none";
                }

                HTML.inner(
                    marketActions.querySelector("div"),
                    `<div class='es_loading' style='min-height: 66px;'><img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>${Localization.str.selling}</div>`
                );

                Page.runInPageContext((sellPrice, sessionID, globalId, contextID, assetID) => {
                    window.Messenger.postMessage("sendFee",
                        {
                            "feeInfo": CalculateFeeAmount(sellPrice, 0.10), // eslint-disable-line no-undef, new-cap
                            sessionID,
                            "global_id": globalId,
                            contextID,
                            assetID,
                        });
                },
                [
                    sellPrice,
                    sessionId,
                    globalId,
                    contextId,
                    assetId,
                ]);
            });
        }
    }

    _makeMarketButton(id, tooltip) {
        return `<a class="item_market_action_button item_market_action_button_green" id="${id}" data-tooltip-text="${tooltip}" style="display:none">
                    <span class="item_market_action_button_edge item_market_action_button_left"></span>
                    <span class="item_market_action_button_contents"></span>
                    <span class="item_market_action_button_edge item_market_action_button_right"></span>
                </a>`;
    }

    _updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency) {
        const quickSell = document.getElementById(`es_quicksell${assetId}`);
        const instantSell = document.getElementById(`es_instantsell${assetId}`);

        // Add Quick Sell button
        if (quickSell && priceHighValue && priceHighValue > priceLowValue) {
            quickSell.dataset.price = priceHighValue;
            quickSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.quick_sell.replace(
                    "__amount__",
                    new Price(priceHighValue, CurrencyManager.currencyNumberToType(walletCurrency))
                );
            quickSell.style.display = "block";
        }

        // Add Instant Sell button
        if (instantSell && priceLowValue) {
            instantSell.dataset.price = priceLowValue;
            instantSell.querySelector(".item_market_action_button_contents").textContent
                = Localization.str.instant_sell.replace(
                    "__amount__",
                    new Price(priceLowValue, CurrencyManager.currencyNumberToType(walletCurrency))
                );
            instantSell.style.display = "block";
        }
    }

    async _showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster, walletCurrencyNumber) {

        marketActions.style.display = "block";
        let firstDiv = marketActions.querySelector("div");
        if (!firstDiv) {
            firstDiv = document.createElement("div");
            marketActions.insertAdjacentElement("afterbegin", firstDiv);
        }

        // "View in market" link
        let html = `<div style="height:24px;"><a href="https://steamcommunity.com/market/listings/${globalId}/${encodeURIComponent(hashName)}">${Localization.str.view_in_market}</a></div>`;

        // Check if price is stored in data
        if (!thisItem.dataset.lowestPrice) {
            firstDiv.innerHTML
                = "<img class='es_loading' src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />";

            const overviewPromise = RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?currency=${walletCurrencyNumber}&appid=${globalId}&market_hash_name=${encodeURIComponent(hashName)}`);

            if (isBooster) {
                thisItem.dataset.cardsPrice = "nodata";

                try {
                    const walletCurrency = CurrencyManager.currencyNumberToType(walletCurrencyNumber);
                    const result = await Background.action("market.averagecardprice", {"appid": appid, "currency": walletCurrency});
                    thisItem.dataset.cardsPrice = new Price(result.average, walletCurrency);
                } catch (error) {
                    console.error(error);
                }
            }

            try {
                const data = await overviewPromise;

                thisItem.dataset.lowestPrice = "nodata";
                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume;
                }
            } catch (error) {
                console.error("Couldn't load price overview from market", error);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += this._getMarketOverviewHtml(thisItem);

        HTML.inner(firstDiv, html);
    }

    _getMarketOverviewHtml(node) {

        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at.replace("__price__", node.dataset.lowestPrice);

            if (node.dataset.dataSold) {
                html += `<br>${Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.dataSold)}`;
            }

            if (node.dataset.cardsPrice) {
                html += `<br>${Localization.str.avg_price_3cards.replace("__price__", node.dataset.cardsPrice)}`;
            }
        } else {
            html += Localization.str.no_price_data;
        }

        html += "</div>";
        return html;
    }
}
