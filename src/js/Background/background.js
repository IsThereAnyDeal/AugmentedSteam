import setup from "../setup";
import {LocalStorage, Permissions, SyncedStorage} from "../modulesCore";
import {ContextMenu} from "./Modules/ContextMenu";
import {IndexedDB} from "./Modules/IndexedDB";
import {SteamCommunityApi} from "./Modules/SteamCommunityApi";
import {SteamStoreApi} from "./Modules/SteamStoreApi";
import {StaticResources} from "./Modules/StaticResources";
import {ITADApi} from "./Modules/ITADApi";
import {AugmentedSteamApi} from "./Modules/AugmentedSteamApi";
import {ExtensionData} from "./Modules/ExtensionData";
import CacheStorage from "./Modules/CacheStorage";

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

    ["earlyAccessAppids", AugmentedSteamApi.endpointFactoryCached(
        "early-access/v1",
        "earlyAccessAppids",
        data => Object.fromEntries(data.map(appid => [appid, appid]))
    )],
    ["storePageData", async({params, key} = {}) => {
        const data = await AugmentedSteamApi.fetchAppPageData(params.appid);
        await IndexedDB.put("storePageData", new Map([[key, data]]));
        return data;
    }],
    ["profiles", async({params, key} = {}) => {
        const data = await AugmentedSteamApi.fetchProfile(params.profile);
        await IndexedDB.put("profiles", new Map([[key, data]]));
        return data;
    }],
    ["rates", AugmentedSteamApi.endpointFactoryCached("rates/v1", "rates")],

    ["collection", async () => {
        const data = await ITADApi.fetchCollection();
        await IndexedDB.put("collection", data);
        return data;
    }],
    ["waitlist", async () => {
        const data = await ITADApi.fetchWaitlist();
        await IndexedDB.put("waitlist", data);
        return data;
    }],
    ["storeList", ITADApi.fetchStoreList],
]);

const actionCallbacks = new Map([
    ["wishlist.add", SteamStoreApi.wishlistAdd],
    ["wishlist.remove", SteamStoreApi.wishlistRemove],
    ["dynamicstore.clear", SteamStoreApi.clearDynamicStore],

    ["steam.currencies", StaticResources.currencies],

    ["migrate.cachestorage", CacheStorage.migrate],

    ["notes.get", ExtensionData.getNote],
    ["notes.set", ExtensionData.setNote],
    ["notes.delete", ExtensionData.deleteNote],
    ["notes.getall", ExtensionData.getAllNotes],
    ["notes.setall", ExtensionData.setAllNotes],
    ["notes.clear", ExtensionData.clearNotes],
    ["cache.clear", ExtensionData.clearCache],

    ["dlcinfo", AugmentedSteamApi.fetchDlcInfo],
    ["storepagedata", AugmentedSteamApi.storePageData],
    ["storepagedata.expire", AugmentedSteamApi.expireStorePageData],
    ["prices", AugmentedSteamApi.fetchPrices],
    ["rates", AugmentedSteamApi.rates],
    ["clearrates", AugmentedSteamApi.clearRates],
    ["isea", AugmentedSteamApi.isEA],
    ["profile.background", AugmentedSteamApi.endpointFactory("profile/background/list/v2")],
    ["profile.background.games", AugmentedSteamApi.endpointFactory("profile/background/games/v1")],
    ["twitch.stream", AugmentedSteamApi.fetchTwitch],
    ["market.cardprices", AugmentedSteamApi.endpointFactory("market/cards/v2")],
    ["market.averagecardprices", AugmentedSteamApi.endpointFactory("market/cards/average-prices/v2")],
    ["steampeek", AugmentedSteamApi.fetchSteamPeek],

    ["appdetails", SteamStoreApi.appDetails],
    ["currency", SteamStoreApi.currency],
    ["sessionid", SteamStoreApi.sessionId],
    ["wishlists", SteamStoreApi.wishlists],
    ["purchases", SteamStoreApi.purchases],
    ["clearpurchases", SteamStoreApi.clearPurchases],
    ["dynamicstore.status", SteamStoreApi.dsStatus],
    ["dynamicstore.randomapp", SteamStoreApi.dynamicStoreRandomApp],

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
    ["itad.storelist", ITADApi.getStoreList],

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
        await Promise.all([IndexedDB, CacheStorage, LocalStorage, SyncedStorage.then(() => { setup(); })]);
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
