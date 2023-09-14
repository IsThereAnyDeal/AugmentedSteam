import {CommunityUtils, ContextType, Messenger} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FAddPriceToGifts from "./FAddPriceToGifts";
import FEquipProfileItems from "./FEquipProfileItems";
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
            FEquipProfileItems,
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
                if (!target.closest("a.inventory_item_link, a.newitem")) { return; }

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

                // Only parse these if the item is a Steam item
                let appid, itemType;
                if (contextId === 6 && globalId === 753) {
                    appid = parseInt(hashName); // Should start with "real" appid
                    
                    itemType = item.description.tags.find(tag => tag.category === "item_class")?.internal_name;

                    // https://github.com/JustArchiNET/ArchiSteamFarm/blob/f55f58a8ef61ba830ed1bee88e5e895b9e4f479d/ArchiSteamFarm/Steam/Data/InventoryResponse.cs#L150
                    switch (itemType) {
                        case "item_class_2":
                            itemType = "card";
                            break;
                        case "item_class_3":
                            itemType = "profilebackground";
                            break;
                        case "item_class_4":
                            itemType = "emoticon";
                            break;
                        case "item_class_5":
                            itemType = "booster";
                            break;
                        case "item_class_6":
                            itemType = "consumable";
                            break;
                        case "item_class_7":
                            itemType = "gems";
                            break;
                        case "item_class_8":
                            itemType = "profilemodifier";
                            break;
                        case "item_class_10":
                            itemType = "saleitem";
                            break;
                        case "item_class_11":
                            itemType = "sticker";
                            break;
                        case "item_class_12":
                            itemType = "chateffect";
                            break;
                        case "item_class_13":
                            itemType = "miniprofilebackground";
                            break;
                        case "item_class_14":
                            itemType = "avatarframe";
                            break;
                        case "item_class_15":
                            itemType = "animatedavatar";
                            break;
                        case "item_class_16":
                            itemType = "keyboardskin";
                            break;
                        default:
                            itemType = "unknown";
                            break;
                    }
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
                    itemType,
                });
            });
        });

        Messenger.addMessageListener("marketInfo", info => { this.triggerCallbacks(info); });
    }
}
