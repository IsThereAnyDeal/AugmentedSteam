import {CommunityUtils, ContextType, Messenger} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FAddPriceToGifts from "./FAddPriceToGifts";
import FSetBackgroundOption from "./FSetBackgroundOption";
import FBadgeProgressLink from "./FBadgeProgressLink";
import FOneClickGemsOption from "./FOneClickGemsOption";
import FQuickSellOptions from "./FQuickSellOptions";
import FShowMarketOverview from "./FShowMarketOverview";
import FInventoryGoTo from "./FInventoryGoTo";
import FPriceHistoryZoomYear from "../FPriceHistoryZoomYear";
import {Page} from "../../Page";

export class CInventory extends CCommunityBase {

    constructor() {
        // Don't apply features on empty or private inventories
        if (document.getElementById("no_inventories")) {
            super(ContextType.INVENTORY);
            return;
        }

        super(ContextType.INVENTORY, [
            FAddPriceToGifts,
            FSetBackgroundOption,
            FBadgeProgressLink,
            FOneClickGemsOption,
            FQuickSellOptions,
            FShowMarketOverview,
            FInventoryGoTo,
            FPriceHistoryZoomYear,
        ]);

        this.myInventory = CommunityUtils.currentUserIsOwner();

        Page.runInPageContext(() => {

            /* eslint-disable no-undef, camelcase */
            document.addEventListener("click", ({target}) => {
                if (!target.matches("a.inventory_item_link, a.newitem")) { return; }

                // https://github.com/SteamDatabase/SteamTracking/blob/b3abe9c82f9e9d260265591320cac6304e500e58/steamcommunity.com/public/javascript/economy_common.js#L161
                const hashName = window.SteamFacade.getMarketHashName(g_ActiveInventory.selectedItem.description);

                const restriction = Array.isArray(g_ActiveInventory.selectedItem.description.owner_descriptions)
                    ? g_ActiveInventory.selectedItem.description.owner_descriptions.some(el => /\[date\]\d+\[\/date\]/.test(el.value) && el.color === "A75124")
                    : false;

                // https://github.com/SteamDatabase/SteamTracking/blob/f26cfc1ec42b8a0c27ca11f4343edbd8dd293255/steamcommunity.com/public/javascript/economy_v2.js#L4468
                const publisherFee = (typeof g_ActiveInventory.selectedItem.description.market_fee !== "undefined" && g_ActiveInventory.selectedItem.description.market_fee !== null)
                    ? g_ActiveInventory.selectedItem.description.market_fee
                    : g_rgWalletInfo.wallet_publisher_fee_percent_default;

                window.Messenger.postMessage("marketInfo", {
                    "view": iActiveSelectView,
                    "sessionId": g_sessionID,
                    "assetId": Number(g_ActiveInventory.selectedItem.assetid),
                    "contextId": Number(g_ActiveInventory.selectedItem.contextid),
                    "globalId": Number(g_ActiveInventory.appid),
                    "walletCurrency": g_rgWalletInfo.wallet_currency,
                    "marketable": g_ActiveInventory.selectedItem.description.marketable,
                    hashName,
                    publisherFee,
                    restriction,
                    "appid": parseInt(hashName) || null,
                    "isBooster": /Booster Pack/i.test(hashName),
                });
            });
            /* eslint-enable no-undef, camelcase */
        });

        Messenger.addMessageListener("marketInfo", info => { this.triggerCallbacks(info); });
    }
}
