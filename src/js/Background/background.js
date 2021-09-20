import setup from "../setup";
import {Permissions, SyncedStorage} from "../modulesCore";
import {ContextMenu} from "./Modules/ContextMenu";
import {IndexedDB} from "./Modules/IndexedDB";
import {SteamCommunityApi} from "./Modules/SteamCommunityApi";
import {SteamStoreApi} from "./Modules/SteamStoreApi";
import {StaticResources} from "./Modules/StaticResources";
import {ITADApi} from "./Modules/ITADApi";
import {AugmentedSteamApi} from "./Modules/AugmentedSteamApi";
import {ExtensionData} from "./Modules/ExtensionData";

// Functions that are called when an object store (or one of its entries) has expired
IndexedDB.objStoreFetchFns = new Map([
    ["coupons", SteamCommunityApi.coupons],
    ["giftsAndPasses", SteamCommunityApi.giftsAndPasses],
    ["items", SteamCommunityApi.items],
    ["workshopFileSizes", SteamCommunityApi.fetchWorkshopFileSize],
    ["reviews", SteamCommunityApi.fetchReviews],

    ["purchases", SteamStoreApi.purchaseDate],
    ["dynamicStore", SteamStoreApi.dynamicStore],
    ["packages", SteamStoreApi.fetchPackage],

    ["earlyAccessAppids", AugmentedSteamApi.endpointFactoryCached("v01/earlyaccess", "earlyAccessAppids")],
    ["storePageData", AugmentedSteamApi.endpointFactoryCached("v01/storepagedata", "storePageData")],
    ["profiles", AugmentedSteamApi.endpointFactoryCached("v01/profile/profile", "profiles")],
    ["rates", AugmentedSteamApi.endpointFactoryCached("v01/rates", "rates")],

    ["collection", ITADApi.endpointFactoryCached("v02/user/coll/all", "collection", ITADApi.mapCollection)],
    ["waitlist", ITADApi.endpointFactoryCached("v01/user/wait/all", "waitlist", ITADApi.mapWaitlist)],
]);

const actionCallbacks = new Map([
    ["wishlist.add", SteamStoreApi.wishlistAdd],
    ["wishlist.remove", SteamStoreApi.wishlistRemove],
    ["dynamicstore.clear", SteamStoreApi.clearDynamicStore],

    ["steam.currencies", StaticResources.currencies],

    ["migrate.notesToSyncedStorage", ExtensionData.moveNotesToSyncedStorage],
    ["notes.get", ExtensionData.getNote],
    ["notes.set", ExtensionData.setNote],
    ["notes.delete", ExtensionData.deleteNote],
    ["notes.getall", ExtensionData.getAllNotes],
    ["notes.setall", ExtensionData.setAllNotes],
    ["notes.clear", ExtensionData.clearNotes],
    ["cache.clear", ExtensionData.clearCache],

    ["dlcinfo", AugmentedSteamApi.endpointFactory("v01/dlcinfo")],
    ["storepagedata", AugmentedSteamApi.storePageData],
    ["storepagedata.expire", AugmentedSteamApi.expireStorePageData],
    ["prices", AugmentedSteamApi.endpointFactory("v01/prices")],
    ["rates", AugmentedSteamApi.rates],
    ["clearrates", AugmentedSteamApi.clearRates],
    ["isea", AugmentedSteamApi.isEA],
    ["profile.background", AugmentedSteamApi.endpointFactory("v01/profile/background/background")],
    ["profile.background.games", AugmentedSteamApi.endpointFactory("v01/profile/background/games")],
    ["twitch.stream", AugmentedSteamApi.endpointFactory("v01/twitch/stream")],
    ["market.cardprices", AugmentedSteamApi.endpointFactory("v01/market/cardprices")],
    ["market.averagecardprice", AugmentedSteamApi.endpointFactory("v01/market/averagecardprice")], // FIXME deprecated
    ["market.averagecardprices", AugmentedSteamApi.endpointFactory("v01/market/averagecardprices")],
    ["steampeek", AugmentedSteamApi.steamPeek],

    ["appdetails", SteamStoreApi.appDetails],
    ["appuserdetails", SteamStoreApi.appUserDetails],
    ["currency", SteamStoreApi.currency],
    ["sessionid", SteamStoreApi.sessionId],
    ["wishlists", SteamStoreApi.wishlists],
    ["purchases", SteamStoreApi.purchases],
    ["clearpurchases", SteamStoreApi.clearPurchases],
    ["dynamicstorestatus", SteamStoreApi.dsStatus],
    ["dynamicStore.randomApp", SteamStoreApi.dynamicStoreRandomApp],

    ["login", SteamCommunityApi.login],
    ["logout", SteamCommunityApi.logout],
    ["storecountry", SteamCommunityApi.storeCountry],
    ["cards", SteamCommunityApi.cards],
    ["stats", SteamCommunityApi.stats],
    ["coupon", SteamCommunityApi.getCoupon],
    ["hasgiftsandpasses", SteamCommunityApi.hasGiftsAndPasses],
    ["hascoupon", SteamCommunityApi.hasCoupon],
    ["hasitem", SteamCommunityApi.hasItem],
    ["profile", SteamCommunityApi.getProfile],
    ["clearownprofile", SteamCommunityApi.clearOwn],
    ["workshopfilesize", SteamCommunityApi.getWorkshopFileSize],
    ["reviews", SteamCommunityApi.getReviews],
    ["updatereviewnode", SteamCommunityApi.updateReviewNode],

    ["itad.authorize", ITADApi.authorize],
    ["itad.disconnect", ITADApi.disconnect],
    ["itad.isconnected", ITADApi.isConnected],
    ["itad.import", ITADApi.import],
    ["itad.sync", ITADApi.sync],
    ["itad.lastimport", ITADApi.lastImport],
    ["itad.inwaitlist", ITADApi.inWaitlist],
    ["itad.addtowaitlist", ITADApi.addToWaitlist],
    ["itad.removefromwaitlist", ITADApi.removeFromWaitlist],
    ["itad.incollection", ITADApi.inCollection],
    ["itad.getfromcollection", ITADApi.getFromCollection],

    ["error.test", () => { return Promise.reject(new Error("This is a TEST Error. Please ignore.")); }],
]);

/*
 * new Map() for Map.prototype.get() in lieu of:
 * Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)
 */

browser.runtime.onMessage.addListener(async(message, sender) => {
    if (!sender || !sender.tab) { return null; } // not from a tab, ignore
    if (!message || !message.action) { return null; }

    const callback = actionCallbacks.get(message.action);
    if (!callback) {

        // requested action not recognized, reply with error immediately
        throw new Error(`Did not recognize "${message.action}" as an action.`);
    }

    message.params = message.params || [];
    let res;
    try {
        await Promise.all([IndexedDB, SyncedStorage.then(() => { setup(); })]);
        res = await callback(...message.params);
    } catch (err) {
        console.group(`Callback: "${message.action}"`);
        console.error('Failed to execute callback "%s" with params %o', message.action, message.params);
        console.error(err);
        console.groupEnd();

        throw new Error(err.toString());
    }
    return res;
});

browser.runtime.onStartup.addListener(ContextMenu.update);
browser.runtime.onInstalled.addListener(ContextMenu.update);

Permissions.when("contextMenus", () => {
    browser.contextMenus.onClicked.addListener(ContextMenu.onClick);
}, () => {
    browser.contextMenus.onClicked.removeListener(ContextMenu.onClick);
});
