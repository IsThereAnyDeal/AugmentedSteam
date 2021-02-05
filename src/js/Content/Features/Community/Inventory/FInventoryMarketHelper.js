import {GameId, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {
    Background, CurrencyManager,
    Feature, Messenger, Price, RequestData, User
} from "../../../modulesContent";
import {Page} from "../../Page";

// TODO Split this up
export default class FInventoryMarketHelper extends Feature {

    apply() {

        Page.runInPageContext(() => {

            /* eslint-disable no-undef, camelcase */
            window.SteamFacade.jq(document).on("click", ".inventory_item_link, .newitem", () => {
                if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
                    g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name;
                }
                let marketRestriction = false;
                if (g_ActiveInventory.selectedItem.description.owner_descriptions) {
                    marketRestriction = g_ActiveInventory.selectedItem.description.owner_descriptions.reduce(
                        (acc, el) => (acc || (/\[date\]\d+\[\/date\]/.test(el.value) && el.color === "A75124")),
                        false,
                    );
                }

                // https://github.com/SteamDatabase/SteamTracking/blob/f26cfc1ec42b8a0c27ca11f4343edbd8dd293255/steamcommunity.com/public/javascript/economy_v2.js#L4468
                const publisherFee = (typeof g_ActiveInventory.selectedItem.description.market_fee !== "undefined" && g_ActiveInventory.selectedItem.description.market_fee !== null)
                    ? g_ActiveInventory.selectedItem.market_fee
                    : g_rgWalletInfo.wallet_publisher_fee_percent_default;

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
                    publisherFee,
                    g_ActiveInventory.m_owner.strSteamId,
                    marketRestriction,
                ]);
            });
            /* eslint-enable no-undef, camelcase */
        });

        Messenger.addMessageListener("sendMessage", info => { this._inventoryMarketHelper(info); });
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
        publisherFee,
        ownerSteamId,
        restriction,
    ]) {

        const _marketable = parseInt(marketable);
        const _globalId = parseInt(globalId);
        const _contextId = parseInt(contextId);
        const isGift = assetType && /Gift/i.test(assetType);
        const isBooster = hashName && /Booster Pack/i.test(hashName);
        const ownsInventory = User.isSignedIn && (ownerSteamId === User.steamId);

        const hm = hashName.match(/^([0-9]+)-/);
        const appid = hm ? hm[1] : null;

        const thisItem = document.querySelector(`[id="${_globalId}_${_contextId}_${assetId}"]`);
        const itemActions = document.querySelector(`#iteminfo${item}_item_actions`);
        const marketActions = document.querySelector(`#iteminfo${item}_item_market_actions`);

        // Set as background option
        if (ownsInventory) {
            this._setBackgroundOption(thisItem, itemActions);
        }

        // Show prices for gifts
        if (isGift) {
            this._addPriceToGifts(itemActions);
            return;
        }

        if (ownsInventory) {

            // Show link to view badge progress for booster packs
            if (isBooster) {
                this._addBoosterPackProgress(item, appid);
            }

            this._addOneClickGemsOption(item, appid, assetId);

            /*
             * 753 is the appid for "Steam" in the Steam Inventory
             * 6 is the context used for "Community Items"; backgrounds, emoticons and trading cards
             * TODO Support non-Steam items
             */
            if (_marketable && _contextId === 6 && _globalId === 753) {
                this._addQuickSellOptions(
                    item,
                    thisItem,
                    marketActions,
                    _contextId,
                    _globalId,
                    assetId,
                    sessionId,
                    walletCurrency,
                    publisherFee
                );
            }
        }

        /*
         * If the item in user's inventory is not marketable due to market restrictions,
         * or if not in own inventory but the item is marketable, build the HTML for showing info
         * TODO Fix the second condition: only add average price of three cards for booster packs in own inventory
         */
        if ((ownsInventory && restriction && !_marketable && hashName !== "753-Gems") || _marketable) {
            this._showMarketOverview(thisItem, marketActions, _globalId, hashName, appid, isBooster, walletCurrency);
        }
    }

    async _setBackgroundOption(thisItem, itemActions) {

        if (itemActions.querySelector(".es_set_background")) { return; }

        // Make sure the selected item is a background
        const viewFullBtn = itemActions.querySelector("a");
        const m = viewFullBtn && viewFullBtn.href.match(/images\/(items\/\d+\/[a-z0-9.]+)/i);
        const bgUrl = m && m[1];
        if (!bgUrl) { return; }

        // Get owned backgrounds and the communityitemid for equipped background
        if (!this.profileBgsOwned) {

            this.userToken = await User.getUserToken();

            try {
                const [equipped, owned] = await Promise.all([
                    RequestData.getJson(`https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1?access_token=${this.userToken}&steamid=${User.steamId}`, {"credentials": "omit"}),
                    RequestData.getJson(`https://api.steampowered.com/IPlayerService/GetProfileItemsOwned/v1?access_token=${this.userToken}`, {"credentials": "omit"})
                ]);

                this.profileBgItemId = equipped.response.profile_background.communityitemid; // undefined if background unset
                this.profileBgsOwned = owned.response.profile_backgrounds;
            } catch (err) {
                console.error(err);
                return;
            }
        }

        // Loop through owned backgrounds to find the communityitemid for selected background
        if (!thisItem.dataset.communityitemid) {
            for (const bg of this.profileBgsOwned) {
                if (bg.image_large === bgUrl) {
                    thisItem.dataset.communityitemid = bg.communityitemid;
                    break;
                }
            }

            if (!thisItem.dataset.communityitemid) {
                console.error("Failed to find communityitemid for selected background");
                return;
            }
        }

        // Make sure the background we are trying to set is not set already
        const linkClass = thisItem.dataset.communityitemid === this.profileBgItemId ? "btn_disabled" : "";

        HTML.afterEnd(viewFullBtn,
            `<a class="es_set_background btn_small btn_darkblue_white_innerfade ${linkClass}">
                <span>${Localization.str.set_as_background}</span>
            </a>`);

        // TODO Add prompt so users can set equip options for the background through IPlayerService/SetEquippedProfileItemFlags
        itemActions.querySelector(".es_set_background").addEventListener("click", async e => {
            e.preventDefault();
            const el = e.target.closest(".es_set_background");

            if (el.classList.contains("es_background_loading") || el.classList.contains("btn_disabled")) { return; }
            el.classList.add("es_background_loading");

            const formData = new FormData();
            formData.append("communityitemid", thisItem.dataset.communityitemid);

            try {
                await RequestData.post(`https://api.steampowered.com/IPlayerService/SetProfileBackground/v1?access_token=${this.userToken}`, formData, {"credentials": "omit"});

                el.classList.add("btn_disabled");
                this.profileBgItemId = thisItem.dataset.communityitemid;
            } catch (err) {
                console.error("Failed to set selected background", err);
            } finally {
                el.classList.remove("es_background_loading");
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
        HTML.beforeEnd(`#iteminfo${item}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="https://steamcommunity.com/my/gamecards/${appid}/"><span>${Localization.str.view_badge_progress}</span></a>`);
    }

    _addOneClickGemsOption(item, appid, assetid) {
        if (!SyncedStorage.get("show1clickgoo")) { return; }

        // scrap link is always present, replace the link to avoid attaching multiple listeners
        const scrapLink = document.getElementById(`iteminfo${item}_item_scrap_link`);
        const newScrapLink = scrapLink.cloneNode(true);
        scrapLink.replaceWith(newScrapLink);

        newScrapLink.querySelector("span").textContent = Localization.str.oneclickgoo;

        newScrapLink.addEventListener("click", e => {
            e.preventDefault();

            /*
             * Modified version of GrindIntoGoo from badges.js
             * https://github.com/SteamDatabase/SteamTracking/blob/ca5145acba077bee42de2593f6b17a6ed045b5f6/steamcommunity.com/public/javascript/badges.js#L521
             */
            Page.runInPageContext((appid, assetid) => {

                /* eslint-disable new-cap, no-undef, camelcase */
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
                /* eslint-enable new-cap, no-undef, camelcase */
            }, [appid, assetid]);
        });
    }

    async _addQuickSellOptions(item, thisItem, marketActions, contextId, globalId, assetId, sessionId, walletCurrency, publisherFee) {
        if (!SyncedStorage.get("quickinv")) { return; }

        const diff = SyncedStorage.get("quickinv_diff");

        // marketActions' innerHTML is cleared on item selection, so the links HTML has to be re-inserted
        HTML.beforeEnd(marketActions,
            this._makeMarketButton(`es_quicksell${item}`, Localization.str.quick_sell_desc.replace("__modifier__", diff))
            + this._makeMarketButton(`es_instantsell${item}`, Localization.str.instant_sell_desc));

        Page.runInPageContext(() => { window.SteamFacade.setupTooltips(); });

        // Check if price is stored in data
        if (!thisItem.dataset.priceLow) {

            if (thisItem.classList.contains("es-loading")) { return; }
            thisItem.classList.add("es-loading");

            thisItem.dataset.priceLow = "nodata";
            thisItem.dataset.priceHigh = "nodata";

            // Get item_nameid of selected item, which can only be found on the item's marketlistings page
            const result = await RequestData.getHttp(marketActions.querySelector("a").href);

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

            thisItem.classList.remove("es-loading");
        }

        // Add data and bind actions to the button if selected item is active
        if (!thisItem.classList.contains("activeInfo")) { return; }

        const quickSell = document.getElementById(`es_quicksell${item}`);
        const instantSell = document.getElementById(`es_instantsell${item}`);

        const priceHighValue = thisItem.dataset.priceHigh !== "nodata" && thisItem.dataset.priceHigh;
        const priceLowValue = thisItem.dataset.priceLow !== "nodata" && thisItem.dataset.priceLow;

        const currencyType = CurrencyManager.currencyNumberToType(walletCurrency);

        // Show Quick Sell button
        if (priceHighValue && priceLowValue && priceHighValue > priceLowValue) {

            Page.runInPageContext((price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceHighValue, currencyType], true)
                .then(formattedPrice => {
                    quickSell.querySelector(".item_market_action_button_contents").textContent
                        = Localization.str.quick_sell.replace("__amount__", formattedPrice);
                });
            quickSell.dataset.price = priceHighValue;
            quickSell.style.display = "block";
        }

        // Show Instant Sell button
        if (priceLowValue) {

            Page.runInPageContext((price, type) => window.SteamFacade.vCurrencyFormat(price, type), [priceLowValue, currencyType], true)
                .then(formattedPrice => {
                    instantSell.querySelector(".item_market_action_button_contents").textContent
                        = Localization.str.instant_sell.replace("__amount__", formattedPrice);
                });
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
            document.getElementById(`iteminfo${item}_item_scrap_actions`).style.display = "none";

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
            HTML.inner(firstDiv, "<img class='es_loading' src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'>");

            // If is a booster pack add the average price of three cards
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
                const overviewUrl = `https://steamcommunity.com/market/priceoverview/?currency=${walletCurrencyNumber}&appid=${globalId}&market_hash_name=${encodeURIComponent(hashName)}`;
                const data = await RequestData.getJson(overviewUrl);

                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume || "nodata";
                }
            } catch (error) {
                console.error("Couldn't load price overview from market", error);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += this._getMarketOverviewHtml(thisItem);
        html += "<div class='market_item_action_buyback_at_price'></div>"; // Steam spacing

        HTML.inner(firstDiv, html);
    }

    _getMarketOverviewHtml(node) {

        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at.replace("__price__", node.dataset.lowestPrice);

            if (node.dataset.soldVolume && node.dataset.soldVolume !== "nodata") {
                html += `<br>${Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.soldVolume)}`;
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
