import {
    __avgPrice_3cards,
    __noPriceData,
    __startingAt,
    __viewInMarket,
    __volumeSoldLast_24,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import HTML from "@Core/Html/Html";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import RequestData from "@Content/Modules/RequestData";

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

                const priceInfoContent = firstDiv.querySelector("div:nth-child(2)");

                /*
                 * Cards prices might have already been fetched (e.g. when clicking on the same pack twice),
                 * causing a race condition with Steam's Ajax handler, so avoid appending to the `elPriceInfoContent` container
                 * See: https://github.com/SteamDatabase/SteamTracking/blob/46fb53b73a61fe2f85fa4c35901360318e118db5/steamcommunity.com/public/javascript/economy_v2.js#L3574
                 */
                if (priceInfoContent) {
                    HTML.afterEnd(
                        priceInfoContent,
                        `<div style="margin-left: 1em;">${L(__avgPrice_3cards, {price: thisItem.dataset.cardsPrice!})}</div>`
                    );
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
