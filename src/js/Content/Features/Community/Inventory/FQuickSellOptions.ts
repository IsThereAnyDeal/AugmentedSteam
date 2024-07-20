import {
    __error,
    __instantSell,
    __instantSellDesc,
    __quickSell,
    __quickSellDesc,
    __quickSellVerify,
    __selling,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
import Messenger from "@Content/Modules/Messaging/Messenger";
import RequestData from "@Content/Modules/RequestData";

export default class FQuickSellOptions extends Feature<CInventory> {

    private readonly _loadedMarketPrices: Record<string, {
        priceLow: number,
        priceHigh: number
    }>;

    constructor(context: CInventory) {
        super(context);

        this._loadedMarketPrices = {};
    }

    override checkPrerequisites(): boolean {
        return this.context.myInventory && Settings.quickinv;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private async callback(marketInfo: MarketInfo): Promise<void> {
        const {
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
        } = marketInfo;

        // Additional checks for market eligibility, see https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L3675
        if (!marketAllowed || (walletCurrency === 0) || !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`)!;
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`)!;
        const diff = Settings.quickinv_diff;

        // marketActions' innerHTML is cleared on item selection, so the links HTML has to be re-inserted
        HTML.beforeEnd(marketActions,
            `<div class="es_qsell_ctn">
                <a class="btn_small btn_grey_white_innerfade" id="es_quicksell${view}" data-tooltip-text="${L(__quickSellDesc, {"modifier": diff})}">
                    <span></span>
                </a>
                <a class="btn_small btn_grey_white_innerfade" id="es_instantsell${view}" data-tooltip-text="${L(__instantSellDesc)}">
                    <span></span>
                </a>
                <div class="es_loading es_qsell_loading">
                    <img src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <span>${L(__selling)}</span>
                </div>
            </div>`);

        // Steam's mutation observer for tooltips is disabled on inventories, so add them manually
        SteamFacade.vTooltip(`#es_quicksell${view}, #es_instantsell${view}`);

        // Check if price is stored in data
        if (!thisItem.dataset.priceLow) {
            if (thisItem.classList.contains("es_prices_loading")) { return; }
            thisItem.classList.add("es_prices_loading");

            let {priceLow = 0, priceHigh = 0} = this._loadedMarketPrices[hashName]
                || await this._getMarketPrices(globalId, country, walletCurrency, hashName).catch(() => null)
                || {};

            if (priceHigh > 0) {
                priceHigh = Math.max((priceHigh / 100) + Number(diff), lowestListingPrice) || 0;
                priceHigh = Number(priceHigh.toFixed(2)) * 100;
            }

            thisItem.dataset.priceLow = String(priceLow);
            thisItem.dataset.priceHigh = String(priceHigh);

            thisItem.classList.remove("es_prices_loading");
        }

        // Add data and bind actions to the button if selected item is active
        if (!thisItem.classList.contains("activeInfo")) { return; }

        const quickSell = document.getElementById(`es_quicksell${view}`)!;
        const instantSell = document.getElementById(`es_instantsell${view}`)!;
        const loadingEl = marketActions.querySelector<HTMLElement>(".es_qsell_loading")!;

        const priceHighValue = Number(thisItem.dataset.priceHigh);
        const priceLowValue = Number(thisItem.dataset.priceLow);

        const currencyType = CurrencyManager.currencyIdToCode(walletCurrency);

        function enableButtons(enable: boolean) {
            for (const button of marketActions.querySelectorAll(".item_market_action_button, .btn_small")) {
                button.classList.toggle("btn_disabled", !enable);
            }
        }

        async function clickHandler(e: MouseEvent): Promise<void> {
            e.preventDefault();

            enableButtons(false);
            loadingEl.style.display = "block";

            const target = e.currentTarget as HTMLElement;
            const feeInfo = await SteamFacade.calculateFeeAmount(Number(target.dataset.price), publisherFee);

            const sellPrice = feeInfo.amount - feeInfo.fees;

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4268
            const data = {
                sessionid: sessionId,
                appid: String(globalId),
                contextid: String(contextId),
                assetid: assetId,
                amount: "1", // TODO support stacked items, e.g. sack of gems
                price: String(sellPrice)
            };

            let response: Response|null = null;
            try {
                response = await RequestData.post("https://steamcommunity.com/market/sellitem/", data);
            } catch(err) {
                console.error(err);
            }

            const result = await response?.json();
            if (!result?.success) {
                loadingEl.textContent = result?.message ?? L(__error);
                enableButtons(true);

                return;
            }

            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4368
            if (result.requires_confirmation) {
                loadingEl.textContent = L(__quickSellVerify);
            } else {
                marketActions!.style.display = "none";
            }

            document.getElementById(`iteminfo${view}_item_scrap_actions`)!.style.display = "none";

            thisItem.classList.add("btn_disabled", "activeInfo");
        }

        // Show Quick Sell button
        if (priceHighValue > 0 && priceHighValue > priceLowValue) {
            this._showSellButton(quickSell, L(__quickSell), priceHighValue, currencyType, clickHandler);
        }

        // Show Instant Sell button
        if (priceLowValue > 0) {
            this._showSellButton(instantSell, L(__instantSell), priceLowValue, currencyType, clickHandler);
        }
    }

    _getMarketPrices(
        globalId: number,
        country: string,
        walletCurrency: number,
        hashName: string
    ) {

        // Get item_nameid of selected item, which can only be found on the item's market listings page
        return RequestData.getText(`https://steamcommunity.com/market/listings/${globalId}/${encodeURIComponent(hashName)}`).then(result => {
            const m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);
            if (!m) {
                console.error("Failed to get nameId for item '%s'", hashName);
                return null;
            }

            return RequestData.getJson<{
                    success?: boolean,
                    highest_buy_order?: string,
                    lowest_sell_order?: string
                }>(`https://steamcommunity.com/market/itemordershistogram?country=${country}&language=english&currency=${walletCurrency}&item_nameid=${m[1]}`).then(data => {
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

    async _showSellButton(buttonEl: HTMLElement, buttonStr: string, priceVal: number, currencyType: string, clickHandler: (e: MouseEvent) => void) {

        const formattedPrice = await SteamFacade.vCurrencyFormat(priceVal, currencyType);

        buttonEl.querySelector("span")!.textContent = buttonStr.replace("__amount__", formattedPrice);
        buttonEl.dataset.price = String(priceVal);
        buttonEl.style.display = "block";
        buttonEl.addEventListener("click", clickHandler);
    }
}
