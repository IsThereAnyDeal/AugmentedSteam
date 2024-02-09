import {Errors, LocalStorage, SyncedStorage, TimeUtils} from "../../modulesCore";
import {Api} from "./Api";
import Config from "../../config";
import {IndexedDB} from "./IndexedDB";

const MAX_ITEMS_PER_REQUEST = 1000;

class ITADApi extends Api {

    static async getStoreList() {
        return Object.values(await IndexedDB.getAll("storeList"));
    }

    static async fetchStoreList() {
        const storeList = (await ITADApi.getEndpoint("service/shops/v1"));
        if (!Array.isArray(storeList)) {
            throw new Error("Can't read store list from response");
        }
        await IndexedDB.put("storeList", storeList, {"multiple": true});
    }

    static async authorize() {
        const redirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

        function generateString(length) {
            const source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.~";
            let arr = new Uint8Array(length);
            window.crypto.getRandomValues(arr)
            return arr.reduce((result, value) => result + source.charAt(Math.floor(value % source.length)), "");
        }

        async function sha256(str) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);

            let sha256Buffer = await window.crypto.subtle.digest("SHA-256", data);
            return String.fromCharCode(...new Uint8Array(sha256Buffer))
        }

        function base64url(str) {
            return btoa(str)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }

        const verifier = generateString(64);
        const state = generateString(30);

        const authUrl = new URL(`${Config.ITADServer}/oauth/authorize/`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", Config.ITADClientId);
        authUrl.searchParams.set("redirect_uri", redirectURI);
        authUrl.searchParams.set("scope", ITADApi.requiredScopes.join(" "));
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", base64url(await sha256(verifier)));
        authUrl.searchParams.set("code_challenge_method", "S256");

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
                        `${redirectURI}/?*` // For Firefox
                    ],
                    "tabId": tab.id
                },
                ["blocking"]
            );
            browser.tabs.onRemoved.addListener(tabsListener);
        });

        const responseUrl = new URL(url);

        if (responseUrl.searchParams.get("state") !== state) {
            throw new Error("Failed to verify state parameter from URL fragment");
        }

        const tokenUrl = new URL("oauth/token/", Config.ITADServer);
        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("client_id", Config.ITADClientId);
        params.set("redirect_uri", redirectURI);
        params.set("code", responseUrl.searchParams.get("code"));
        params.set("code_verifier", verifier);

        let response = await fetch(tokenUrl, {
            method: "POST",
            body: params
        });
        const tokens = await response.json();

        const accessToken = tokens.access_token;
        const expiresIn = tokens.expires_in;

        if (!accessToken || !expiresIn) {
            throw new Error(`Authorization failed`);
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

    static async _fetchSteamIds(gids) {
        let response = await fetch(new URL("unstable/id-lookup/steam/v1", Config.ITADApiServerHost), {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(gids)
        });

        if (response.ok) {
            let obj = await response.json();
            let map = new Map();
            for (let [itad, steam] of Object.entries(obj)) {
                if (steam !== null) {
                    map.set(steam, itad);
                }
            }
            return map;
        }

        throw new Errors.HTTPError(response.status, response.statusText);
    }

    static async _fetchGameIds(steamIds) {
        let response = await fetch(new URL("unstable/id-lookup/game/v1", Config.ITADApiServerHost), {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(steamIds)
        });

        if (response.ok) {
            let obj = await response.json();
            let map = new Map();
            for (let [steam, itad] of Object.entries(obj)) {
                if (itad !== null) {
                    map.set(steam, itad);
                }
            }
            return map;
        }

        throw new Errors.HTTPError(response.status, response.statusText);
    }

    static async fetchCollection() {
        if (!ITADApi.isConnected()) {
            return null;
        }

        let response = await fetch(new URL("/collection/games/v1", Config.ITADApiServerHost), {
            headers: {"authorization": "Bearer " + ITADApi.accessToken}
        });
        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        let collection = await response.json();
        let gids = collection.map(entry => entry.id);
        let map = await ITADApi._fetchSteamIds(gids);

        this._recordLastImport();
        return map;
    }

    static async fetchWaitlist() {
        if (!ITADApi.isConnected()) {
            return null;
        }

        let response = await fetch(new URL("/waitlist/games/v1", Config.ITADApiServerHost), {
            headers: {"authorization": "Bearer " + ITADApi.accessToken}
        });

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        let waitlist = await response.json();
        let gids = waitlist.map(entry => entry.id);
        let map = await ITADApi._fetchSteamIds(gids);

        this._recordLastImport();
        return map;
    }

    static async _recordLastImport() {
        const lastImport = LocalStorage.get("lastItadImport");
        lastImport.from = TimeUtils.now();
        LocalStorage.set("lastItadImport", lastImport);
    }

    static async removeFromWaitlist(appids_) {
        if (!appids_ || (Array.isArray(appids_) && !appids_.length)) {
            throw new Error("Can't remove nothing from ITAD Waitlist!");
        }
        const appids = Array.isArray(appids_) ? appids_ : [appids_];
        const steamids = appids.map(appid => `app/${appid}`);
        let gids = await Promise.all(
            steamids.map(id => IndexedDB.get("waitlist", id))
        );
        gids = gids.filter(value => value); // filter out undefined values

        if (gids.length > 0) {
            let response = await fetch(new URL("waitlist/games/v1", Config.ITADApiServerHost), {
                method: "DELETE",
                headers: {"authorization": "Bearer " + ITADApi.accessToken},
                body: JSON.stringify(gids)
            });

            if (response.ok) {
                return IndexedDB.delete("waitlist", steamids)
            }
        }

        // TODO error handling
    }

    static async addToWaitlist(appids_) {
        const appids = Array.isArray(appids_) ? appids_ : [appids_];
        if (appids.length === 0) { return; }

        const steamids = appids.map(appid => `app/${appid}`);
        const map = await ITADApi._fetchGameIds(steamids);

        if (map.size !== 0) {
            let response = await fetch(new URL("waitlist/games/v1", Config.ITADApiServerHost), {
                method: "PUT",
                headers: {"authorization": "Bearer " + ITADApi.accessToken},
                body: JSON.stringify(Array.from(map.values()))
            });

            if (response.ok) {
                return IndexedDB.put("waitlist", map)
            }
        }

        // TODO error handling
    }

    static async addToCollection(appids_, subids_) {
        const appids = Array.isArray(appids_) ? appids_ : [appids_];
        const subids = Array.isArray(subids_) ? subids_ : [subids_];

        const steamids = [
            ...appids.map(appid => `app/${appid}`),
            ...subids.map(subid => `sub/${subid}`),
        ];

        if (steamids.length === 0) {
            return;
        }

        const map = await ITADApi._fetchGameIds(steamids);

        if (map.size !== 0) {
            let response = await fetch(new URL("collection/games/v1", Config.ITADApiServerHost), {
                method: "PUT",
                headers: {"authorization": "Bearer " + ITADApi.accessToken},
                body: JSON.stringify(Array.from(map.values()))
            });

            if (response.ok) {
                return IndexedDB.put("collection", map)
            }
        }

        // TODO error handling
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
                () => IndexedDB.objStoreFetchFns.get("waitlist")()
            ),
            IndexedDB.clear("collection").then(
                () => IndexedDB.objStoreFetchFns.get("collection")()
            ),
        ]);
    }

    static lastImport() { return LocalStorage.get("lastItadImport"); }

    static inWaitlist(storeIds) {
        return IndexedDB.contains("waitlist", storeIds);
    }

    static inCollection(storeIds) {
        return IndexedDB.contains("collection", storeIds);
    }

    static getFromCollection(storeId) {
        return IndexedDB.get("collection", storeId);
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
