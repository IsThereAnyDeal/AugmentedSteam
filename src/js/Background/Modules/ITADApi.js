import {LocalStorage} from "../../Core/Storage/LocalStorage";
import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Api} from "./Api";
import Config from "../../config";
import {IndexedDB} from "./IndexedDB";

const MAX_ITEMS_PER_REQUEST = 1000;

class ITADApi extends Api {

    static async authorize() {
        const rnd = crypto.getRandomValues(new Uint32Array(1))[0];
        const redirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

        const authUrl = new URL(`${Config.ITADApiServerHost}/oauth/authorize/`);
        authUrl.searchParams.set("client_id", Config.ITADClientId);
        authUrl.searchParams.set("response_type", "token");
        authUrl.searchParams.set("state", rnd);
        authUrl.searchParams.set("scope", ITADApi.requiredScopes.join(" "));
        authUrl.searchParams.set("redirect_uri", redirectURI);

        const tab = await browser.tabs.create({"url": authUrl.toString()});

        const url = await new Promise((resolve, reject) => {
            function webRequestListener({url}) {
                resolve(url);

                browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                // eslint-disable-next-line no-use-before-define -- Circular dependency
                browser.tabs.onRemoved.removeListener(tabsListener);

                browser.tabs.remove(tab.id);
                return {"cancel": true};
            }

            function tabsListener(tabId) {
                if (tabId === tab.id) {
                    reject(new Error("Authorization tab closed"));

                    browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                    browser.tabs.onRemoved.removeListener(tabsListener);
                }
            }

            browser.webRequest.onBeforeRequest.addListener(
                webRequestListener,
                {
                    "urls": [
                        redirectURI, // For Chrome, seems to not support match patterns (a problem with the Polyfill?)
                        `${redirectURI}#*` // For Firefox
                    ],
                    "tabId": tab.id
                },
                ["blocking"]
            );
            browser.tabs.onRemoved.addListener(tabsListener);
        });

        const hashFragment = new URL(url).hash;
        const params = new URLSearchParams(hashFragment.substr(1));

        if (parseInt(params.get("state")) !== rnd) {
            throw new Error("Failed to verify state parameter from URL fragment");
        }

        const accessToken = params.get("access_token");
        const expiresIn = params.get("expires_in");

        if (!accessToken || !expiresIn) {
            throw new Error(`Couldn't retrieve information from URL fragment "${hashFragment}"`);
        }

        LocalStorage.set("access_token", {
            "token": accessToken,
            "expiry": TimeUtils.now() + parseInt(expiresIn)
        });
    }

    static disconnect() {
        LocalStorage.remove("access_token");
        LocalStorage.remove("lastItadImport");
        return IndexedDB.clear(["collection", "waitlist", "itadImport"]);
    }

    static isConnected() {
        const lsEntry = LocalStorage.get("access_token");
        if (!lsEntry) { return false; }

        if (lsEntry.expiry <= TimeUtils.now()) {
            LocalStorage.remove("access_token");
            return false;
        }
        ITADApi.accessToken = lsEntry.token;

        return true;
    }

    static endpointFactoryCached(endpoint, storeName, resultFn) {
        return ({params = {}, key} = {}) => {
            if (ITADApi.isConnected()) {
                return super.endpointFactoryCached(endpoint, storeName, resultFn)(
                    {"params": Object.assign(params, {"access_token": ITADApi.accessToken}), key}
                );
            }
            return null;
        };
    }

    static async removeFromWaitlist(appids) {
        if (!appids || (Array.isArray(appids) && !appids.length)) {
            throw new Error("Can't remove nothing from ITAD Waitlist!");
        }

        const _appids = Array.isArray(appids) ? appids : [appids];
        const storeids = _appids.map(appid => `app/${appid}`);

        await ITADApi.deleteEndpoint(
            "v02/user/wait/remove/",
            {"access_token": ITADApi.accessToken, "shop": "steam", "ids": storeids.join()}
        );

        return IndexedDB.delete("waitlist", storeids);
    }

    static async addToWaitlist(appIds) {
        const waitlistJSON = {
            "version": "02",
            "data": [],
        };

        const storeIdsArr = [];
        const storeIdsObj = {};
        const _appIds = Array.isArray(appIds) ? appIds : [appIds];

        for (const appId of _appIds) {
            const storeId = `app/${appId}`;
            storeIdsArr.push(storeId);
            storeIdsObj[storeId] = null;
        }

        await this.splitPostRequests(waitlistJSON, storeIdsArr, "v01/waitlist/import/", id => ({
            "gameid": ["steam", id],
        }));

        return IndexedDB.put("waitlist", storeIdsObj);
    }

    static async addToCollection(appIds, subIds) {
        const collectionJSON = {
            "version": "02",
            "data": [],
        };

        const _appIds = Array.isArray(appIds) ? appIds : [appIds];
        const _subIds = Array.isArray(subIds) ? subIds : [subIds];

        const storeIds = _appIds.map(appId => `app/${appId}`).concat(_subIds.map(subId => `sub/${subId}`));

        await this.splitPostRequests(collectionJSON, storeIds, "v01/collection/import/", id => ({
            "gameid": ["steam", id],
            "copies": [{
                "type": "steam",
                "status": "redeemed",
                "owned": 1,
            }],
        }));

        // TODO Add to DB
    }

    static async splitPostRequests(json, items, endpoint, getJson) {
        const responses = [];

        for (let i = 0; i < items.length;) {
            for (; i < items.length && json.data.length < MAX_ITEMS_PER_REQUEST; i++) {
                json.data.push(getJson(items[i]));
            }

            responses.push(await ITADApi.postEndpoint(
                endpoint,
                {"access_token": ITADApi.accessToken},
                null,
                {"body": JSON.stringify(json)}
            ));

            json.data = [];
        }

        return responses;
    }

    static async import(force) {

        if (force) {
            await IndexedDB.clear("dynamicStore");
        } else {
            const lastImport = LocalStorage.get("lastItadImport");

            if (lastImport && lastImport.to && !IndexedDB.isExpired(lastImport.to + (12 * 60 * 60))) { return; }
        }

        const dsKeys = [];
        const itadImportKeys = [];
        if (SyncedStorage.get("itad_import_library")) {
            dsKeys.push("ownedApps", "ownedPackages");
            itadImportKeys.push("lastOwnedApps", "lastOwnedPackages");
        }

        if (SyncedStorage.get("itad_import_wishlist")) {
            dsKeys.push("wishlisted");
            itadImportKeys.push("lastWishlisted");
        }

        const result = await Promise.all([
            IndexedDB.get("dynamicStore", dsKeys),
            IndexedDB.get("itadImport", itadImportKeys),
        ]);

        function removeDuplicates(from, other) {
            if (!from) { return []; }
            if (!other) { return from; }
            return from.filter(el => !other.includes(el));
        }

        const promises = [];

        if (SyncedStorage.get("itad_import_library")) {
            const [{ownedApps, ownedPackages}, {lastOwnedApps, lastOwnedPackages}] = result;
            const newOwnedApps = removeDuplicates(ownedApps, lastOwnedApps);
            const newOwnedPackages = removeDuplicates(ownedPackages, lastOwnedPackages);
            if (newOwnedApps.length || newOwnedPackages.length) {
                promises.push(ITADApi.addToCollection(newOwnedApps, newOwnedPackages)
                    .then(() => IndexedDB.put("itadImport", {
                        "lastOwnedApps": ownedApps,
                        "lastOwnedPackages": ownedPackages,
                    })));
            }
        }

        if (SyncedStorage.get("itad_import_wishlist")) {
            const [{wishlisted}, {lastWishlisted}] = result;
            const newWishlisted = removeDuplicates(wishlisted, lastWishlisted);
            if (newWishlisted.length) {
                promises.push(ITADApi.addToWaitlist(newWishlisted)
                    .then(() => IndexedDB.put("itadImport", {"lastWishlisted": wishlisted})));
            }
        }

        await Promise.all(promises);

        const lastImport = LocalStorage.get("lastItadImport");
        lastImport.to = TimeUtils.now();
        LocalStorage.set("lastItadImport", lastImport);
    }

    static async sync() {
        await Promise.all([
            ITADApi.import(true),
            IndexedDB.clear("waitlist").then(
                () => IndexedDB.objStoreFetchFns.get("waitlist")(
                    {"params": {"shop": "steam", "optional": "gameid"}}
                )
            ),
            IndexedDB.clear("collection").then(
                () => IndexedDB.objStoreFetchFns.get("collection")(
                    {"params": {"shop": "steam", "optional": "gameid,copy_type"}}
                )
            ),
        ]);
    }

    static lastImport() { return LocalStorage.get("lastItadImport"); }

    static mapCollection(result) {
        if (!result) { return null; }
        const {games, typemap} = result;

        const collection = {};
        games.forEach(({gameid, types}) => {
            const _types = types.map(type => typemap[type]);

            collection[gameid] = _types;
        });

        const lastImport = LocalStorage.get("lastItadImport");
        lastImport.from = TimeUtils.now();
        LocalStorage.set("lastItadImport", lastImport);

        return collection;
    }

    static mapWaitlist(result) {
        if (!result) { return null; }

        const waitlist = [];
        for (const {gameid} of Object.values(result)) {
            waitlist.push(gameid);
        }

        const lastImport = LocalStorage.get("lastItadImport");
        lastImport.from = TimeUtils.now();
        LocalStorage.set("lastItadImport", lastImport);

        return waitlist;
    }

    static inWaitlist(storeIds) {
        return IndexedDB.contains("waitlist", storeIds, {"params": {"shop": "steam", "optional": "gameid"}});
    }

    static inCollection(storeIds) {
        return IndexedDB.contains("collection", storeIds, {"params": {"shop": "steam", "optional": "gameid,copy_type"}});
    }

    static getFromCollection(storeId) {
        return IndexedDB.get("collection", storeId, {"params": {"shop": "steam", "optional": "gameid,copy_type"}});
    }
}
ITADApi.accessToken = null;
ITADApi.requiredScopes = [
    "wait_read",
    "wait_write",
    "coll_read",
    "coll_write",
];

ITADApi.origin = Config.ITADApiServerHost;
ITADApi._progressingRequests = new Map();

export {ITADApi};
