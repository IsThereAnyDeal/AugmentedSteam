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
        if (document.getElementById("no_inventories") !== null) {
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
            document.addEventListener("click", ({target}) => {
                if (!target.matches("a.inventory_item_link, a.newitem")) { return; }

                const f = window.SteamFacade;
                const g = f.global;

                const inv = g("g_ActiveInventory");
                const wallet = g("g_rgWalletInfo");
                const item = inv.selectedItem;

                // https://github.com/SteamDatabase/SteamTracking/blob/b3abe9c82f9e9d260265591320cac6304e500e58/steamcommunity.com/public/javascript/economy_common.js#L161
                const hashName = f.getMarketHashName(item.description);

                /*
                 * See https://github.com/IsThereAnyDeal/AugmentedSteam/pull/1047#discussion_r571444376
                 * Update: For non-Steam items, the text may not have a color, so test date only
                 */
                const restriction = Array.isArray(item.description.owner_descriptions)
                    && item.description.owner_descriptions.some(desc => /\[date\]\d+\[\/date\]/.test(desc.value));

                // https://github.com/SteamDatabase/SteamTracking/blob/f26cfc1ec42b8a0c27ca11f4343edbd8dd293255/steamcommunity.com/public/javascript/economy_v2.js#L4468
                const publisherFee = item.description.market_fee ?? wallet.wallet_publisher_fee_percent_default;

                /*
                 * The lowest amount Steam allows any party to receive is 0.01, so use that to calculate lowest listing price
                 * https://github.com/SteamDatabase/SteamTracking/blob/b3abe9c82f9e9d260265591320cac6304e500e58/steamcommunity.com/public/javascript/economy_common.js#L154-L155
                 */
                const lowestListingPrice = f.calculateAmountToSendForDesiredReceivedAmount(1, publisherFee).amount / 100;

                const contextId = Number(item.contextid);
                const globalId = Number(inv.appid);

                let appid = 0;
                let isBooster = false;

                // Only parse hashname if the item is a Steam item
                if (contextId === 6 && globalId === 753) {
                    appid = parseInt(hashName);
                    isBooster = /Booster Pack/i.test(hashName);
                }

                window.Messenger.postMessage("marketInfo", {
                    "view": g("iActiveSelectView"),
                    "sessionId": g("g_sessionID"),
                    "marketAllowed": g("g_bMarketAllowed"),
                    "country": g("g_strCountryCode"),
                    "assetId": item.assetid, // DO NOT cast this to a number as the value might exceed Number.MAX_SAFE_INTEGER
                    contextId,
                    globalId,
                    "walletCurrency": wallet.wallet_currency,
                    "marketable": item.description.marketable,
                    hashName,
                    publisherFee,
                    lowestListingPrice,
                    restriction,
                    appid,
                    isBooster,
                });
            });
        });

        Messenger.addMessageListener("marketInfo", info => { this.triggerCallbacks(info); });
    }
}
