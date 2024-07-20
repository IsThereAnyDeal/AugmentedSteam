import {
    __avgPrice_3cards,
    __noPriceData,
    __startingAt,
    __viewInMarket,
    __volumeSoldLast_24,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import CInventory, {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import HTML from "@Core/Html/Html";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import RequestData from "@Content/Modules/RequestData";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FShowMarketOverview extends Feature<CInventory> {

    // https://steamcommunity.com/groups/tradingcards/discussions/1/864969482042344380/#c864969482044786566
    private readonly _foilChance = 0.01;


    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private async callback(marketInfo: MarketInfo): Promise<void> {
        const {
            view,
            assetId,
            contextId,
            globalId,
            walletCurrency,
            marketable,
            hashName,
            restriction,
            appid,
            itemType
        } = marketInfo;

        /*
         * If the item in user's inventory is not marketable due to market restrictions,
         * or if not in own inventory but the item is marketable, build the HTML for showing info
         */
        if (!(this.context.myInventory && restriction && !marketable) && !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);
        if (!thisItem || !marketActions) {
            return;
        }

        // If is a booster pack get the average price of three cards
        if (itemType === "booster" && !thisItem.dataset.cardsPrice) {
            if (thisItem.classList.contains("es_avgprice_loading")) { return; }
            thisItem.classList.add("es_avgprice_loading");

            thisItem.dataset.cardsPrice = "nodata";

            try {
                const currency = CurrencyManager.currencyIdToCode(walletCurrency);
                const result = await AugmentedSteamApiFacade.fetchMarketCardAveragePrices(currency, [appid]);
                if (!result || !result[appid]) {
                    throw new Error("Requested appid not in reesult");
                }

                const avgPrice
                    = Number(((result[appid]!.foil * this._foilChance) + (result[appid]!.regular * (1 - this._foilChance))).toFixed(2)) * 100;

                thisItem.dataset.cardsPrice = await SteamFacade.vCurrencyFormat(avgPrice, currency);
            } catch (err) {
                console.error("Failed to retrieve average card prices for appid", appid, err);
            } finally {
                thisItem.classList.remove("es_avgprice_loading");
            }
        }

        let firstDiv = marketActions.querySelector(":scope > div");
        if (firstDiv) {

            // In own inventory, only add the average price of three cards to booster packs
            if (thisItem.dataset.cardsPrice && thisItem.dataset.cardsPrice !== "nodata") {

                const priceInfoDiv = firstDiv.querySelector("div:nth-child(2)")!;

                /*
                 * Due to race conditions the lowest price might have already been fetched (e.g. when request is loaded from cache).
                 * Therefore the Ajax handler wouldn't get triggered.
                 * This comparison checks for the existence of the text node "Starting at: ..."
                 */
                if (priceInfoDiv.firstChild!.nodeType === Node.TEXT_NODE) {
                    priceInfoDiv.append(L(__avgPrice_3cards, {"price": thisItem.dataset.cardsPrice}));
                } else {
                    document.addEventListener("as_marketOverviewPopulation", () => {
                        firstDiv!.querySelector("div:nth-child(2)")!
                            .append(L(__avgPrice_3cards, {price: thisItem.dataset.cardsPrice!}));
                    }, {once: true});

                    DOMHelper.insertScript("scriptlets/Community/Inventory/marketOverviewPopulation.js", {hashName});
                }
            }

            return;
        }

        firstDiv = document.createElement("div");
        marketActions.insertAdjacentElement("afterbegin", firstDiv);
        marketActions.style.display = "block";

        const _hashName = encodeURIComponent(hashName);

        // "View in market" link
        let html = `<div style="height:24px;">
                        <a href="//steamcommunity.com/market/listings/${globalId}/${_hashName}">${L(__viewInMarket)}</a>
                    </div>`;

        // Check if price is stored in data
        if (!thisItem.dataset.lowestPrice) {
            if (firstDiv.querySelector("img.es_loading") !== null) { return; }

            HTML.inner(firstDiv, '<img class="es_loading" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">');

            thisItem.dataset.lowestPrice = "nodata";
            thisItem.dataset.soldVolume = "nodata";

            try {
                const data = await RequestData.getJson<{
                    success?: boolean,
                    lowest_price?: number,
                    volume?: number
                }>(`https://steamcommunity.com/market/priceoverview/?currency=${walletCurrency}&appid=${globalId}&market_hash_name=${_hashName}`);

                if (data && data.success) {
                    thisItem.dataset.lowestPrice = String(data.lowest_price ?? "nodata");
                    thisItem.dataset.soldVolume = String(data.volume ?? "nodata");
                }
            } catch (err) {
                console.error("Couldn't load price overview from market", err);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += this._getMarketOverviewHtml(thisItem);
        html += '<div class="market_item_action_buyback_at_price"></div>'; // Steam spacing

        HTML.inner(firstDiv, html);
    }

    _getMarketOverviewHtml(node: HTMLElement): string {

        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += L(__startingAt, {"price": node.dataset.lowestPrice});

            if (node.dataset.soldVolume && node.dataset.soldVolume !== "nodata") {
                html += "<br>";
                html += L(__volumeSoldLast_24, {"sold": node.dataset.soldVolume});
            }

            // cards price data is only fetched for booster packs
            if (node.dataset.cardsPrice && node.dataset.cardsPrice !== "nodata") {
                html += "<br>";
                html += L(__avgPrice_3cards, {"price": node.dataset.cardsPrice});
            }
        } else {
            html += L(__noPriceData);
        }

        html += "</div>";
        return html;
    }
}
