import {LocalStorage} from "../../Core/Storage/LocalStorage";
import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Api} from "./Api";
import Config from "../../config";
import {IndexedDB} from "./IndexedDB";
import {Redirect} from "./Redirect";

class ITADApi extends Api {

    static async authorize() {
        const rnd = crypto.getRandomValues(new Uint32Array(1))[0];
        const redirectURL = "https://isthereanydeal.com/connectaugmentedsteam";

        const authUrl = new URL(`${Config.ITADApiServerHost}/oauth/authorize/`);
        authUrl.searchParams.set("client_id", Config.ITADClientId);
        authUrl.searchParams.set("response_type", "token");
        authUrl.searchParams.set("state", rnd);
        authUrl.searchParams.set("scope", ITADApi.requiredScopes.join(" "));
        authUrl.searchParams.set("redirect_uri", redirectURL);

        const url = await Redirect.waitForRedirect(authUrl, redirectURL);

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

    static async getEndpoint(...args) { return (await super.getEndpoint(...args)).data; }
    static async postEndpoint(...args) { return (await super.postEndpoint(...args)).data; }
    static async deleteEndpoint(...args) { return (await super.deleteEndpoint(...args)).data; }

    static async addToWaitlist(appids) {
        if (!appids || (Array.isArray(appids) && !appids.length)) {
            console.warn("Can't add nothing to ITAD waitlist");
            return null;
        }

        const waitlistJSON = {
            "version": "02",
            "data": [],
        };

        const storeids = {};
        if (Array.isArray(appids)) {
            appids.forEach(appid => {
                const id = `app/${appid}`;
                waitlistJSON.data.push({
                    "gameid": ["steam", id],
                });
                storeids[id] = null;
            });
        } else {
            const id = `app/${appids}`;
            waitlistJSON.data[0] = {
                "gameid": ["steam", id],
            };
            storeids[id] = null;
        }

        await ITADApi.postEndpoint(
            "v01/waitlist/import/",
            {"access_token": ITADApi.accessToken},
            null,
            {"body": JSON.stringify(waitlistJSON)}
        );

        return IndexedDB.put("waitlist", storeids);
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

    static addToCollection(appids, subids) {
        if ((!appids || (Array.isArray(appids) && !appids.length)) && (!subids || (Array.isArray(subids) && !subids.length))) {
            console.warn("Can't add nothing to ITAD collection");
            return null;
        }

        const collectionJSON = {
            "version": "02",
            "data": [],
        };

        let _appids;
        if (Array.isArray(appids)) {
            _appids = appids;
        } else if (appids) {
            _appids = [appids];
        } else {
            _appids = [];
        }

        let _subids;
        if (Array.isArray(subids)) {
            _subids = subids;
        } else if (subids) {
            _subids = [subids];
        } else {
            _subids = [];
        }

        const storeids = _appids.map(appid => `app/${appid}`).concat(_subids.map(subid => `sub/${subid}`));
        for (const storeid of storeids) {
            collectionJSON.data.push({
                "gameid": ["steam", storeid],
                "copies": [{
                    "type": "steam",
                    "status": "redeemed",
                    "owned": 1,
                }],
            });
        }

        return ITADApi.postEndpoint(
            "v01/collection/import/",
            {"access_token": ITADApi.accessToken},
            null,
            {"body": JSON.stringify(collectionJSON)}
        );
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
