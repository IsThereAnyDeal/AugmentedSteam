class CacheStorage {
    static isExpired (timestamp, ttl) {
        if (!timestamp) return true;
        if (typeof ttl != 'number' || ttl < 0) ttl = 0;
        return timestamp + ttl <= Timestamp.now();
    }

    static get(key, ttl, defaultValue) {
        if (!ttl) return defaultValue;
        let item = localStorage.getItem('cache_' + key);
        if (!item) return defaultValue;
        try {
            item = JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
        if (!item.timestamp || CacheStorage.isExpired(item.timestamp, ttl)) return defaultValue;
        return item.data;
    }

    static set(key, value) {
        localStorage.setItem('cache_' + key, JSON.stringify({ 'data': value, 'timestamp': Timestamp.now(), }));
    }

    static remove(key) {
        localStorage.removeItem('cache_' + key);
    }

    static keys() {
        return LocalStorage.keys()
            .filter(k => k.startsWith('cache_'))
            .map(k => k.substring(6)); // "cache_".length == 6
    }

    static clear() {
        let keys = CacheStorage.keys();
        for (let key of keys) {
            CacheStorage.remove(key);
        }
    }
}

class AugmentedSteam {
    static clearCache() {
        CacheStorage.clear();
        return IndexedDB.clear();
    }

    /*
     * TEMP(1.4.1)
     * TODO delete after few versions
     */
    static async moveNotesToSyncedStorage() {
        let idbNotes = Object.entries(await IndexedDB.getAll("notes"));

        let notes = SyncedStorage.get("user_notes");
        for (let [appid, note] of idbNotes) {
            notes[appid] = note;
        }
        SyncedStorage.set("user_notes", notes);
    }
}

class Api {
    // FF doesn't support static members
    // static origin; // this *must* be overridden
    // static params = {};
    // withResponse? use a boolean to include Response object in result?
    static _fetchWithDefaults(endpoint, query={}, params={}) {
        let url = new URL(endpoint, this.origin);
        params = Object.assign({}, this.params, params);
        if (params && params.method === 'POST' && !params.body) {
            let formData = new FormData();
            for (let [k, v] of Object.entries(query)) {
                formData.append(k, v);
            }
            params.body = formData;
        } else {
            for (let [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        return fetch(url, params);
    }

    static async getEndpoint(endpoint, query, responseHandler, params = {}) {
        if (!endpoint.endsWith('/')) endpoint += '/';

        let response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, { "method": "GET" }));
        if (responseHandler) responseHandler(response);
        return response.json();
    }    
    static async getPage(endpoint, query, responseHandler, params = {}) {
        let response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, { "method": "GET" }));
        if (responseHandler) responseHandler(response);
        return response.text();
    }
    static async postEndpoint(endpoint, query, responseHandler, params = {}) {
        if (!endpoint.endsWith('/')) endpoint += '/';

        let response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, { "method": "POST" }));
        if (responseHandler) responseHandler(response);
        return response.json();
    }
    static async deleteEndpoint(endpoint, query, responseHandler, params = {}) {
        if (!endpoint.endsWith('/')) endpoint += '/';

        let response = await this._fetchWithDefaults(endpoint, query, Object.assign(params, { "method": "DELETE" }));
        if (responseHandler) responseHandler(response);
        return response.json();
    }
    static endpointFactory(endpoint, objPath) {
        return async params => {
            let result = await this.getEndpoint(endpoint, params);
            if (objPath) {
                if (Array.isArray(objPath)) {
                    for (let part of objPath) {
                        result = result[part];
                    }
                } else {
                    result = result[objPath];
                }
            } else {
                result = result.data;
            }
            return result;
        }
    }
    static endpointFactoryCached(endpoint, storeName, mapFn) {
        return async ({ params, key } = {}) => {
            let result = await this.getEndpoint(endpoint, params);

            if (mapFn) {
                result = mapFn(result.data);
            } else {
                result = result.data;
            }

            return IndexedDB.put(storeName, typeof key !== "undefined" ? new Map([[key, result]]) : result);
        };
    }
}
Api.params = {};


class AugmentedSteamApi extends Api {
    // static origin = Config.ApiServerHost;
    // static _progressingRequests = new Map();
    
    static async getEndpoint(endpoint, query) { // withResponse? boolean that includes Response object in result?
        let json = await super.getEndpoint(endpoint, query, response => {
            if (response.status === 500) {
                // Beautify HTTP 500: "User 'p_enhsteam' has exceeded the 'max_user_connections' resource (current value: XX)", which would result in a SyntaxError due to JSON.parse
                throw new ServerOutageError(`Augmented Steam servers are currently overloaded, failed to fetch endpoint "${endpoint}"`);
            }
        });
        if (!json.result || json.result !== "success") {
            throw new Error(`Could not retrieve '${endpoint}'`);
        }
        delete json.result;
        return json;
    }    

    static storePageData(appid, metalink, showoc) { 
        let params = { "appid": appid };
        if (metalink)   params.mcurl = metalink;
        if (showoc)     params.oc = 1;
        return IndexedDB.get("storePageData", appid, { params });
    }

    static expireStorePageData(appid) {
        return IndexedDB.delete("storePageData", `app_${appid}`);
    }

    static rates(to) {
        return IndexedDB.getAll("rates", { "params": { "to": to.sort().join(',') } });
    }

    static isEA(appids) {
        return IndexedDB.contains("earlyAccessAppids", appids);
    }

    static steamPeek(appid) {
        return AugmentedSteamApi.endpointFactory("v01/similar")({ appid, "count": 15 });
    }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();

class ITAD_Api extends Api {

    static async authorize() {
        let rnd = crypto.getRandomValues(new Uint32Array(1))[0];
        let redirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

        /*
         * How to use webRequest with event pages:
         * https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/K8njaUCU81c/eUxMIEACAQAJ
         *
         * Preventing event page from unloading by using iframe
         * https://stackoverflow.com/a/58577052
         */
        function noop() {} // so we can removeListener
        browser.runtime.onConnect.addListener(noop);

        /*
         * For some reason the scripts are not inserted on FF,
         * but this doesn't really matter since FF doesn't support event pages.
         * Therefore the event listeners never gets unloaded.
         */
        document.body.appendChild(document.createElement("iframe")).src = "authorizationFrame.html";

        let authUrl = new URL(`${Config.ITAD_ApiServerHost}/oauth/authorize/`);
        authUrl.searchParams.set("client_id", Config.ITAD_ClientID);
        authUrl.searchParams.set("response_type", "token");
        authUrl.searchParams.set("state", rnd);
        authUrl.searchParams.set("scope", ITAD_Api.requiredScopes.join(' '));
        authUrl.searchParams.set("redirect_uri", redirectURI);

        let tab = await browser.tabs.create({"url": authUrl.toString()});

        let url;
        try {
            url = await new Promise((resolve, reject) => {
                function webRequestListener({ url }) {
                    resolve(url);
                    
                    browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                    browser.tabs.onRemoved.removeListener(tabsListener);

                    browser.tabs.remove(tab.id);
                    return { "cancel": true };
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
                            redirectURI,        // For Chrome, seems to not support match patterns (probably a problem with the Polyfill?)
                            `${redirectURI}#*`  // For Firefox
                        ],
                        "tabId": tab.id
                    }, ["blocking"]);
                browser.tabs.onRemoved.addListener(tabsListener);
            });
        } finally {
            browser.runtime.onConnect.removeListener(noop);
            document.querySelector("iframe").remove();
        }

        let hashFragment = new URL(url).hash;
        let params = new URLSearchParams(hashFragment.substr(1));

        if (parseInt(params.get("state")) !== rnd) {
            throw new Error("Failed to verify state parameter from URL fragment");
        }

        let accessToken = params.get("access_token");
        let expiresIn = params.get("expires_in");

        if (!accessToken || !expiresIn) {
            throw new Error(`Couldn't retrieve information from URL fragment "${hashFragment}"`);
        }
            
        LocalStorage.set("access_token", {
            token: accessToken,
            expiry: Timestamp.now() + parseInt(expiresIn, 10)
        });
    }

    static disconnect() {
        LocalStorage.remove("access_token");
        LocalStorage.remove("lastItadImport");
        return IndexedDB.clear(["collection", "waitlist", "itadImport"]);
    }

    static isConnected() {
        let lsEntry = LocalStorage.get("access_token");
        if (!lsEntry) return false;

        if (lsEntry.expiry <= Timestamp.now()) {
            LocalStorage.remove("access_token");
            return false;
        }
        ITAD_Api.accessToken = lsEntry.token;
        
        return true;
    }

    static endpointFactoryCached(endpoint, storeName, resultFn) {
        return async ({ params = {}, key } = {}) => {
            if (ITAD_Api.isConnected()) {
                return super.endpointFactoryCached(endpoint, storeName, resultFn)({ "params": Object.assign(params, { "access_token": ITAD_Api.accessToken }), key });
            }
        }
    }

    static async addToWaitlist(appids) {
        if (!appids || (Array.isArray(appids) && !appids.length)) {
            console.warn("Can't add nothing to ITAD waitlist");
            return;
        }

        let waitlistJSON = {
            "version": "02",
            "data": [],
        };

        let storeids = {};
        if (Array.isArray(appids)) {
            appids.forEach(appid => {
                let id = `app/${appid}`;
                waitlistJSON.data.push({
                    "gameid": ["steam", id],
                });
                storeids[id] = null;
            });
        } else {
            let id = `app/${appids}`;
            waitlistJSON.data[0] = {
                "gameid": ["steam", id],
            };
            storeids[id] = null;
        }

        await ITAD_Api.postEndpoint("v01/waitlist/import/", { "access_token": ITAD_Api.accessToken }, null, { "body": JSON.stringify(waitlistJSON) });
        return IndexedDB.put("waitlist", storeids);
    }

    static async removeFromWaitlist(appids) {
        if (!appids || (Array.isArray(appids) && !appids.length)) {
            throw new Error("Can't remove nothing from ITAD Waitlist!");
        }

        appids = Array.isArray(appids) ? appids : [appids];
        let storeids = appids.map(appid => `app/${appid}`);

        await ITAD_Api.deleteEndpoint("v02/user/wait/remove/", { "access_token": ITAD_Api.accessToken, "shop": "steam", "ids": storeids.join() });
        return IndexedDB.delete("waitlist", storeids);
    }

    static addToCollection(appids, subids) {
        if ((!appids || (Array.isArray(appids) && !appids.length)) && (!subids || (Array.isArray(subids) && !subids.length))) {
            console.warn("Can't add nothing to ITAD collection");
            return;
        }

        let collectionJSON = {
            "version": "02",
            "data": [],
        };

        appids = Array.isArray(appids) ? appids : (appids ? [appids] : []);
        subids = Array.isArray(subids) ? subids : (subids ? [subids] : []);

        let storeids = appids.map(appid => `app/${appid}`).concat(subids.map(subid => `sub/${subid}`));
        for (let storeid of storeids) {
            collectionJSON.data.push({
                "gameid": ["steam", storeid],
                "copies": [{
                    "type": "steam",
                    "status": "redeemed",
                    "owned": 1,
                }],
            });
        }

        return ITAD_Api.postEndpoint("v01/collection/import/", { "access_token": ITAD_Api.accessToken }, null, { "body": JSON.stringify(collectionJSON) });
    }

    static async import(force) {

        if (force) {
            await IndexedDB.clear("dynamicStore");
        } else {
            let lastImport = LocalStorage.get("lastItadImport");

            if (lastImport && lastImport.to && !IndexedDB.isExpired(lastImport.to + 12 * 60 * 60)) { return; }
        }

        let dsKeys = [];
        let itadImportKeys = [];
        if (SyncedStorage.get("itad_import_library")) {
            dsKeys.push("ownedApps", "ownedPackages");
            itadImportKeys.push("lastOwnedApps", "lastOwnedPackages");
        }

        if (SyncedStorage.get("itad_import_wishlist")) {
            dsKeys.push("wishlisted");
            itadImportKeys.push("lastWishlisted");
        }

        let result = await Promise.all([
            IndexedDB.get("dynamicStore", dsKeys),
            IndexedDB.get("itadImport", itadImportKeys),
        ]);

        function removeDuplicates(from, other) {
            if (!from) return [];
            if (!other) return from;
            return from.filter(el => !other.includes(el));
        }

        let promises = [];

        if (SyncedStorage.get("itad_import_library")) {
            let [{ ownedApps, ownedPackages }, { lastOwnedApps, lastOwnedPackages }] = result;
            let newOwnedApps = removeDuplicates(ownedApps, lastOwnedApps);
            let newOwnedPackages = removeDuplicates(ownedPackages, lastOwnedPackages);
            if (newOwnedApps.length || newOwnedPackages.length) {
                promises.push(ITAD_Api.addToCollection(newOwnedApps, newOwnedPackages)
                    .then(() => IndexedDB.put("itadImport", {
                        "lastOwnedApps": ownedApps,
                        "lastOwnedPackages": ownedPackages,
                    })));
            }
        }

        if (SyncedStorage.get("itad_import_wishlist")) {
            let [{ wishlisted }, { lastWishlisted }] = result;
            let newWishlisted = removeDuplicates(wishlisted, lastWishlisted);
            if (newWishlisted.length) {
                promises.push(ITAD_Api.addToWaitlist(newWishlisted)
                    .then(() => IndexedDB.put("itadImport", { "lastWishlisted": wishlisted })));
            }
        }
        
        await Promise.all(promises);

        let lastImport = LocalStorage.get("lastItadImport") || {};
        lastImport.to = Timestamp.now();
        LocalStorage.set("lastItadImport", lastImport);
    }

    static async sync() {
        await Promise.all([
            ITAD_Api.import(true),
            IndexedDB.clear("waitlist").then(() => IndexedDB.objStoreFetchFns.get("waitlist")({ "params": { "shop": "steam", "optional": "gameid" } })),
            IndexedDB.clear("collection").then(() => IndexedDB.objStoreFetchFns.get("collection")({ "params": { "shop": "steam", "optional": "gameid,copy_type" } })),
        ]);        
    }

    static lastImport() { return LocalStorage.get("lastItadImport"); }

    static mapCollection(result) {
        if (!result) return;
        let { games, typemap } = result;
        
        let collection = {};
        games.forEach(({ gameid, types }) => {
            types = types.map(type => typemap[type]);

            collection[gameid] = types;
        });

        let lastImport = LocalStorage.get("lastItadImport") || {};
        lastImport.from = Timestamp.now();
        LocalStorage.set("lastItadImport", lastImport);

        return collection;
    }

    static mapWaitlist(result) {
        if (!result) return;
        
        let waitlist = [];
        for (let { gameid } of Object.values(result)) {
            waitlist.push(gameid);
        }

        let lastImport = LocalStorage.get("lastItadImport") || {};
        lastImport.from = Timestamp.now();
        LocalStorage.set("lastItadImport", lastImport);

        return waitlist;
    }

    static inWaitlist(storeIds) { return IndexedDB.contains("waitlist", storeIds, { "params": { "shop": "steam", "optional": "gameid" } }); }
    static inCollection(storeIds) { return IndexedDB.contains("collection", storeIds, { "params": { "shop": "steam", "optional": "gameid,copy_type" } }); }
    static getFromCollection(storeId) { return IndexedDB.get("collection", storeId, { "params": { "shop": "steam", "optional": "gameid,copy_type" } }); }
}
ITAD_Api.accessToken = null;
ITAD_Api.requiredScopes = [
    "wait_read",
    "wait_write",
    "coll_read",
    "coll_write",
];

ITAD_Api.origin = Config.ITAD_ApiServerHost;
ITAD_Api._progressingRequests = new Map();

class ContextMenu {

    static onClick(info) {
        let query = encodeURIComponent(info.selectionText.trim());
        let url = ContextMenu.queryLinks[info.menuItemId];
        if (!url) { return; }
        
        if (info.menuItemId === "context_steam_keys") {
            let steamKeys = query.match(/[A-Z0-9]{5}(-[A-Z0-9]{5}){2}/g);
            if (!steamKeys || steamKeys.length === 0) {
                window.alert(Localization.str.options.no_keys_found);
                return;
            }

            for (let steamKey of steamKeys) {
                browser.tabs.create({ "url": url.replace("__steamkey__", steamKey) });
            }
        } else {
            browser.tabs.create({ "url": url.replace("__query__", query) });
        }
    }
    
    static async build() {
        await Localization;

        for (let option of Object.keys(ContextMenu.queryLinks)) {
            if (!SyncedStorage.get(option)) { continue; }

            browser.contextMenus.create({
                "id": option,
                "title": Localization.str.options[option].replace("__query__", "%s"),
                "contexts": ["selection"]
            },
            // TODO don't recreate the context menu entries on each change, only update the affected entry (which should also prevent this error)
            // Error when you create an entry with duplicate id
            () => chrome.runtime.lastError);
        }
    }
    
    static update() {
        browser.contextMenus.removeAll().then(ContextMenu.build);
    }
}

ContextMenu.queryLinks = {
    "context_steam_store": "https://store.steampowered.com/search/?term=__query__",
    "context_steam_market": "https://steamcommunity.com/market/search?q=__query__",
    "context_itad": "https://isthereanydeal.com/search/?q=__query__",
    "context_bartervg": "https://barter.vg/search?q=__query__",
    "context_steamdb": "https://steamdb.info/search/?q=__query__",
    "context_steamdb_instant": "https://steamdb.info/instantsearch/?query=__query__",
    "context_steam_keys": "https://store.steampowered.com/account/registerkey?key=__steamkey__"
}


class SteamStore extends Api {
    // static origin = "https://store.steampowered.com/";
    // static params = { 'credentials': 'include', };
    // static _progressingRequests = new Map();

    static async fetchPackage({ "key": subid }) {
        let data = await SteamStore.getEndpoint("/api/packagedetails/", { "packageids": subid, });
        let appids = new Map();

        for (let [subid, details] of Object.entries(data)) {
            if (details && details.success) {
                // .apps is an array of { 'id': ##, 'name': "", }
                appids.set(Number(subid), details.data.apps.map(obj => obj.id))
            } else {
                appids.set(Number(subid), null);
            }
        }
        return IndexedDB.put("packages", appids);
    }
    
    static async wishlistAdd(appid) {
        let res;
        let sessionid = await SteamStore.sessionId();

        if (sessionid) {
            res = await SteamStore.postEndpoint("/api/addtowishlist", { sessionid, appid });
        }
        
        if (!res || !res.success) {
            throw new Error(`Failed to add app ${appid} to wishlist`);
        }

        return SteamStore.clearDynamicStore();
    }

    static async wishlistRemove(appid, sessionid) {
        let res;

        if (!sessionid) {
            sessionid = await SteamStore.sessionId();
        }
        if (sessionid) {
            res = await SteamStore.postEndpoint("/api/removefromwishlist", { sessionid, appid });
        }

        if (!res || !res.success) {
            throw new Error(`Failed to remove app ${appid} from wishlist`);
        }

        return SteamStore.clearDynamicStore();
    }

    static async currencyFromWallet() {
        let html = await SteamStore.getPage("/steamaccount/addfunds");
        let dummyPage = HTMLParser.htmlToDOM(html);

        return dummyPage.querySelector("input[name=currency]").value;
    }

    static async currencyFromApp() {
        let html = await SteamStore.getPage("/app/220");
        let dummyPage = HTMLParser.htmlToDOM(html);

        let currency = dummyPage.querySelector("meta[itemprop=priceCurrency][content]");
        if (!currency || !currency.getAttribute("content")) {
            throw new Error("Store currency could not be determined from app 220");
        }

        return currency.getAttribute("content");
    }

    static async currency() {
        let currency = CacheStorage.get("currency", 60 * 60);
        if (currency) return currency;

        currency = await SteamStore.currencyFromWallet();
        if (!currency) { currency = await SteamStore.currencyFromApp(); }
        if (!currency) { throw new Error("Could not retrieve store currency"); }

        CacheStorage.set("currency", currency);
        return currency;
    }

    /**
     * Invoked if we were previously logged out and are now logged in
     */
    static async country() {
        let self = SteamStore;
        let html = await self.getPage("/account/change_country/", {}, res => {
            if (new URL(res.url).pathname === "/login/") {
                throw new LoginError("store");
            }
        });
        let dummyPage = HTMLParser.htmlToDOM(html);

        let node = dummyPage.querySelector("#dselect_user_country");
        return node && node.value;
    }

    static async sessionId() {
        let self = SteamStore;
        // TODO what's the minimal page we can load here to get sessionId?
        let html = await self.getPage("/news/");
        return HTMLParser.getVariableFromText(html, "g_sessionID", "string");
    }

    static async wishlists(path) {
        let html = await SteamStore.getPage(`/wishlist${path}`);
        let data = HTMLParser.getVariableFromText(html, "g_rgWishlistData", "array");
        return data ? data.length : '';
    }
    
    static async purchaseDate({ "params": lang }) {
        let replaceRegex = [
            /- Complete Pack/ig,
            /Standard Edition/ig,
            /Steam Store and Retail Key/ig,
            /- Hardware Survey/ig,
            /ComputerGamesRO -/ig,
            /Founder Edition/ig,
            /Retail( Key)?/ig,
            /Complete$/ig,
            /Launch$/ig,
            /Free$/ig,
            /(RoW)/ig,
            /ROW/ig,
            /:/ig,
        ];
        let purchaseDates = new Map();

        let html = await SteamStore.getPage("/account/licenses/", { 'l': lang, });
        let dummyPage = HTMLParser.htmlToDOM(html);
        let nodes = dummyPage.querySelectorAll("#main_content td.license_date_col");
        for (let node of nodes) {
            let name = node.nextElementSibling;
            let removeNode = name.querySelector("div");
            if (removeNode) { removeNode.remove(); }

            let appName = HTMLParser.clearSpecialSymbols(name.textContent.trim());
            for (let regex of replaceRegex) {
                appName = appName.replace(regex, "");
            }
            appName = appName.trim();
            purchaseDates.set(appName, node.textContent);
        }

        return IndexedDB.put("purchases", purchaseDates);
    }

    static purchases(appName, lang) { return IndexedDB.get("purchases", appName, { "params": lang }) }
    static clearPurchases() { return IndexedDB.clear("purchases") }

    static async dynamicStore() {
        let { rgOwnedApps, rgOwnedPackages, rgIgnoredApps, rgWishlist } = await SteamStore.getEndpoint("dynamicstore/userdata");
        
        let dynamicStore = {
            "ignored": Object.keys(rgIgnoredApps).map(key => Number(key)),
            "ownedApps": rgOwnedApps,
            "ownedPackages": rgOwnedPackages,
            "wishlisted": rgWishlist,
        };
        // dynamicstore keys are:
        // "rgWishlist", "rgOwnedPackages", "rgOwnedApps", "rgPackagesInCart", "rgAppsInCart"
        // "rgRecommendedTags", "rgIgnoredApps", "rgIgnoredPackages", "rgCurators", "rgCurations"
        // "rgCreatorsFollowed", "rgCreatorsIgnored", "preferences", "rgExcludedTags",
        // "rgExcludedContentDescriptorIDs", "rgAutoGrantApps"

        return IndexedDB.put("dynamicStore", dynamicStore);
    }

    static dsStatus(ids) {
        return IndexedDB.getFromIndex("dynamicStore", "appid", ids, { "all": true, "asKey": true })
    }

    static async dynamicStoreRandomApp() {
        let store = await IndexedDB.getAll("dynamicStore");
        if (!store || !store.ownedApps) { return null; }
        return store.ownedApps[Math.floor(Math.random() * store.ownedApps.length)];
    }

    static async clearDynamicStore() {
        await IndexedDB.clear("dynamicStore");
        Steam._dynamicstore_promise = null;
    }

    static appDetails(appid, filter)    {
        let params = { "appids": appid };
        if (filter) { params.filters = filter; }

        return SteamStore.endpointFactory("api/appdetails/", appid)(params);
    }
    static appUserDetails(appid) { return SteamStore.endpointFactory("api/appuserdetails/", appid)({ "appids": appid }); }
}
SteamStore.origin = "https://store.steampowered.com/";
SteamStore.params = { 'credentials': 'include', };
SteamStore._progressingRequests = new Map();


class SteamCommunity extends Api {
    // static origin = "https://steamcommunity.com/";
    // static params = { 'credentials': 'include', };

    static cards(appid, border) {
        return SteamCommunity.getPage(`/my/gamecards/${appid}`, (border ? { "border": 1 } : {}));
    }

    static stats(path, appid) {
        return SteamCommunity.getPage(`${path}/stats/${appid}`);
    }

    static async getInventory(contextId) {
        let login = LocalStorage.get("login");
        if (!login) {
            console.warn("Must be signed in to access Inventory");
            return;
        }

        let params = { "l": "english", "count": 2000 };
        let data = null;
        let result, last_assetid;

        do {
            let thisParams = Object.assign(params, last_assetid ? { "start_assetid": last_assetid } : null);
            result = await SteamCommunity.getEndpoint(`/inventory/${login.steamId}/753/${contextId}`, thisParams, res => {
                if (res.status === 403) {
                    throw new LoginError("community");
                }
            });
            if (result && result.success) {
                if (!data) data = { "assets": [], "descriptions": [] };
                if (result.assets) data.assets = data.assets.concat(result.assets);
                if (result.descriptions) data.descriptions = data.descriptions.concat(result.descriptions);
                last_assetid = result.last_assetid;
            }
        } while (result.more_items);

        if (!data) {
            throw new Error(`Could not retrieve Inventory 753/${contextId}`);
        }
        return data;
    }

    /**
     * Inventory functions, must be signed in to function correctly
     */
    static async coupons() { // context#3
        let coupons = new Map();
        let data = await SteamCommunity.getInventory(3);
        if (!data) return;

        for (let description of data.descriptions) {
            if (!description.type || description.type !== "Coupon") { continue; }
            if (!description.actions) { continue; }

            let coupon = {
                "image_url": description.icon_url,
                "title": description.name,
                "discount": description.name.match(/([1-9][0-9])%/)[1],
                "id": description.classid + '_' + description.instanceid
            };
            description.descriptions.forEach((desc, i) => {
                let value = desc.value;
                if (value.startsWith("Can't be applied with other discounts.")) {
                    Object.assign(coupon, {
                        "discount_note": value,
                        "discount_note_id": i,
                        "discount_doesnt_stack": true,
                    });
                } else if (value.startsWith("(Valid")) {
                    Object.assign(coupon, {
                        "valid_id": i,
                        "valid": value,
                    });
                }
            });
            
            for (let action of description.actions) {
                let match = action.link.match(/[1-9][0-9]*(?:,[1-9][0-9]*)*/);
                if (!match) {
                    console.warn("Couldn't find packageid(s) for link %s", action.link);
                    continue;
                }

                for (let packageid of match[0].split(',')) {
                    packageid = Number(packageid);
                    if (!coupons.has(packageid) || coupons.get(packageid).discount < coupon.discount) {
                        coupons.set(packageid, coupon);
                    }
                }
            }
        }

        let packages = await IndexedDB.get("packages", Array.from(coupons.keys()));

        for (let [subid, coupon] of coupons.entries()) {
            let details = packages[subid];
            if (details) {
                coupon.appids = details;
            } else {
                coupon.appids = [];
            }
        }

        return IndexedDB.put("coupons", coupons);
    }

    static getCoupon(appid) { return IndexedDB.getFromIndex("coupons", "appid", appid) }
    static hasCoupon(appid) { return IndexedDB.indexContainsKey("coupons", "appid", appid) }

    static async giftsAndPasses() { // context#1, gifts and guest passes
        let gifts = [];
        let passes = [];

        let data = await SteamCommunity.getInventory(1);
        if (!data) return;

        for (let description of data.descriptions) {
            let isPackage = false;
            if (description.descriptions) {
                for (let desc of description.descriptions) {
                    if (desc.type === "html") {
                        let appids = GameId.getAppids(desc.value);
                        // Gift package with multiple apps
                        isPackage = true;
                        for (let appid of appids) {
                            if (!appid) { continue; }
                            if (description.type === "Gift") {
                                gifts.push(appid);
                            } else {
                                passes.push(appid);
                            }
                        }
                        break;
                    }
                }
            }

            // Single app
            if (!isPackage && description.actions) {
                let appid = GameId.getAppid(description.actions[0].link);
                if (appid) {
                    if (description.type === "Gift") {
                        gifts.push(appid);
                    } else {
                        passes.push(appid);
                    }
                }
            }
        }

        data = {
            "gifts": gifts,
            "passes": passes,
        };

        return IndexedDB.put("giftsAndPasses", data);
    }

    static async hasGiftsAndPasses(appid) { return IndexedDB.getFromIndex("giftsAndPasses", "appid", appid, { "all": true, "asKey": true }); }

    static async items() { // context#6, community items
        // only used for market highlighting
        let data = await SteamCommunity.getInventory(6);
        if (data) {
            return IndexedDB.put("items", data.descriptions.map(item => item.market_hash_name));
        }
    }

    static hasItem(hashes) { return IndexedDB.contains("items", hashes); }

    static async fetchWorkshopFileSize({ "key": id }) {
        let parser = new DOMParser();
        let res = await SteamCommunity.getPage(`/sharedfiles/filedetails/`, { id });
        let doc = parser.parseFromString(res, "text/html");

        let details = doc.querySelector(".detailsStatRight");
        if (!details || !details.innerText.includes("MB")) { throw new Error("Couldn't find details block for workshop file size"); }

        let text = details.innerText.split(" ")[0].trim();
        let size = parseFloat(text.replace(/,/g, ""));
        
        return IndexedDB.put("workshopFileSizes", new Map([[Number(id), size * 1000]]));
    }

    static getWorkshopFileSize(id, preventFetch) {
        return IndexedDB.get("workshopFileSizes", Number(id), { preventFetch });
    }

    static _getReviewId(node) {
        let input = node.querySelector("input");

        // Only exists when the requested profile is yours (these are the input fields where you can change visibility and language of the review)
        if (input) {
            return Number(input.id.replace("ReviewVisibility", ''));
        }
        // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
        return Number(node.querySelector(".control_block > a").id.replace("RecommendationVoteUpBtn", ''));
    }

    static async fetchReviews({ "key": steamId, "params": { reviewCount } }) {
        let parser = new DOMParser();
        let pageCount = 10;
        let reviews = [];

        for (let p = 1; p <= Math.ceil(reviewCount / pageCount); p++) {
            let doc = parser.parseFromString(await SteamCommunity.getPage(`${steamId}/recommended`, { p }), "text/html");

            for (let node of doc.querySelectorAll(".review_box")) {
                let headerText = node.querySelector(".header").innerHTML.split("<br>");
                let playtimeText = node.querySelector(".hours").textContent.split("(")[0].match(/(\d+,)?\d+\.\d+/);
                let visibilityNode = node.querySelector(".dselect_container:nth-child(2) .trigger");

                let id = SteamCommunity._getReviewId(node);
                let rating = node.querySelector("[src*=thumbsUp]") ? 1 : 0;
                let helpful = headerText[0] && headerText[0].match(/\d+/g) ? parseInt(headerText[0].match(/\d+/g).join("")): 0;
                let funny = headerText[1] && headerText[1].match(/\d+/g) ? parseInt(headerText[1].match(/\d+/g).join("")): 0;
                let length = node.querySelector(".content").textContent.trim().length;
                let visibility = visibilityNode ? visibilityNode.textContent : "Public";
                let playtime = playtimeText ? parseFloat(playtimeText[0].split(",").join("")) : 0.0;

                reviews.push({ rating, helpful, funny, length, visibility, playtime, "node": DOMPurify.sanitize(node.outerHTML), id })
            }
        }

        return IndexedDB.put("reviews", { [steamId]: reviews });
    }

    static async updateReviewNode(steamId, html, reviewCount) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        let node = doc.querySelector(".review_box");
        let id = SteamCommunity._getReviewId(node);

        if (!await IndexedDB.contains("reviews", steamId, { "preventFetch": true })) { return; }

        let reviews = await IndexedDB.get("reviews", steamId, { "params": reviewCount });

        for (let review of reviews) {
            if (review.id === id) {
                review.node = DOMPurify.sanitize(node.outerHTML);
                break;
            }
        }

        // Todo updates expiry even though there is no new fetched data
        return IndexedDB.put("reviews", { [steamId]: reviews });
    }

    static async getReviews(steamId, reviewCount) {
        return IndexedDB.get("reviews", steamId, { "params": { reviewCount } });
    }

    /**
     * Invoked when the content script thinks the user is logged in
     * If we don't know the user's steamId, fetch their community profile
     */
    static async login(profilePath) {
        let self = SteamCommunity;
        let login;

        if (!profilePath) {
            self.logout();
            throw new Error("Login endpoint needs a valid profile path");
        }
        if (!profilePath.startsWith("/id/") && !profilePath.startsWith("/profiles/")) {
            self.logout();
            throw new Error(`Could not interpret ${profilePath} as a valid profile path`);
        }

        login = LocalStorage.get("login");
        if (login && login.profilePath === profilePath) { return login; }

        let html = await self.getPage(profilePath);
        let profileData = HTMLParser.getVariableFromText(html, "g_rgProfileData", "object");
        let steamId = profileData.steamid;
        if (!steamId) { // this should never happen
            throw new Error("Failed to retrieve steamID from profile");
        }

        self.logout(true);

        let value = { steamId, profilePath };
        LocalStorage.set("login", value);

        return value;
    }

    static logout(newLogout = LocalStorage.has("login")) {
        if (newLogout) {
            LocalStorage.remove("login");
            LocalStorage.remove("storeCountry");
            CacheStorage.remove("currency");
        }
    }

    // TODO This and (at least) the login calls don't seem appropriate in this class
    static storeCountry(newCountry) {
        if (newCountry) {
            LocalStorage.set("storeCountry", newCountry);
        } else {
            return LocalStorage.get("storeCountry");
        }
    }

    static getProfile(steamId) { return IndexedDB.get("profiles", steamId, { "params": { "profile": steamId } }); }
    static clearOwn(steamId) { return IndexedDB.delete("profiles", steamId) }

    static async getPage(endpoint, query) {
        let response = await this._fetchWithDefaults(endpoint, query, { method: "GET" });
        if (new URL(response.url).pathname === "/login/") {
            throw new LoginError("community");
        }
        return response.text();
    }
}
SteamCommunity.origin = "https://steamcommunity.com/";
SteamCommunity.params = { 'credentials': 'include', };


class Steam {
    // static _supportedCurrencies = null;    

    static fetchCurrencies() {
        // https://partner.steamgames.com/doc/store/pricing/currencies
        return ExtensionResources.getJSON("json/currency.json");
    }
    static async currencies() {
        let self = Steam;
        if (!self._supportedCurrencies || self._supportedCurrencies.length < 1) {
            self._supportedCurrencies = await self.fetchCurrencies();
        }
        return self._supportedCurrencies;
    }
}
Steam._supportedCurrencies = null;

class IndexedDB {
    static init() {
        if (IndexedDB._promise) { return IndexedDB._promise; }
        return IndexedDB._promise = idb.openDB("Augmented Steam", Info.db_version, {
            upgrade(db, oldVersion, newVersion, tx) {
                if (oldVersion < 1) {
                    db.createObjectStore("coupons").createIndex("appid", "appids", { unique: false, multiEntry: true });
                    db.createObjectStore("giftsAndPasses").createIndex("appid", '', { unique: false, multiEntry: true });
                    db.createObjectStore("items");
                    db.createObjectStore("earlyAccessAppids");
                    db.createObjectStore("purchases");
                    db.createObjectStore("dynamicStore").createIndex("appid", '', { unique: false, multiEntry: true });
                    db.createObjectStore("packages").createIndex("expiry", "expiry");
                    db.createObjectStore("storePageData").createIndex("expiry", "expiry");
                    db.createObjectStore("profiles").createIndex("expiry", "expiry");
                    db.createObjectStore("rates");
                    db.createObjectStore("notes");
                    db.createObjectStore("collection");
                    db.createObjectStore("waitlist");
                    db.createObjectStore("itadImport");
                }

                if (oldVersion < 2) {
                    db.createObjectStore("workshopFileSizes").createIndex("expiry", "expiry");
                    db.createObjectStore("reviews").createIndex("expiry", "expiry");
                }

                if (oldVersion < 3) {
                    db.createObjectStore("expiries").createIndex("expiry", '');

                    tx.objectStore("packages").deleteIndex("expiry");
                    tx.objectStore("storePageData").deleteIndex("expiry");
                    tx.objectStore("profiles").deleteIndex("expiry");
                    tx.objectStore("workshopFileSizes").deleteIndex("expiry");
                    tx.objectStore("reviews").deleteIndex("expiry");
                }
            },
            blocked() {
                console.error("Failed to upgrade database, there is already an open connection");
            },
        })
        .then(db => { IndexedDB.db = db; })
        .then(IndexedDB._deleteOldData);
    }
    static then(onDone, onCatch) {
        return IndexedDB.init().then(onDone, onCatch);
    }

    static async _deleteOldData() {
        let expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        let cursor = await expiryStore.index("expiry").openCursor(IDBKeyRange.upperBound(Timestamp.now()));
        let expired = [];
        let stores = {};
        let promises = [];

        while (cursor) {
            expired.push(cursor.primaryKey);
            promises.push(expiryStore.delete(cursor.primaryKey));
            cursor = await cursor.continue();
        }

        for (let expiryKey of expired) {
            let [storeName, key] = expiryKey.split(/_/);
            if (!stores[storeName]) {
                stores[storeName] = [];
            }

            if (key) {
                stores[storeName].push(key);
            }
        }

        for (let [storeName, keys] of Object.entries(stores)) {

            let dataStore = IndexedDB.db.transaction(storeName, "readwrite").store;

            if (IndexedDB.timestampedStores.has(storeName)) {
                promises.push(dataStore.clear());
            } else {
                promises.push(Promise.all(keys.map(key => {

                    let strKeyPromise = dataStore.delete(key);

                    let nmbKey = Number(key);
                    if (nmbKey) {
                        return Promise.all([
                            strKeyPromise,
                            dataStore.delete(nmbKey),
                        ]);
                    }

                    return strKeyPromise;
                })));
            }
        }

        return Promise.all(promises);
    }

    static async put(storeName, data, { ttl, multiple = typeof data === "object" } = {}) {
        let tx = IndexedDB.db.transaction(storeName, "readwrite");
        let expiryTx;

        let expiry;
        let expiryKeys = [];

        let cached = IndexedDB.cacheObjectStores.has(storeName);
        let timestampedEntry = IndexedDB.timestampedEntriesStores.has(storeName);

        function nonAssociativeData(data) {
            let promise;
            if (tx.store.autoIncrement || tx.store.keyPath !== null) {
                promise = tx.store.put(data);
            } else {
                promise = tx.store.put(null, data);
            }
            promise.then(key => { if (timestampedEntry) { expiryKeys.push(`${storeName}_${key}`); } });
        }

        if (cached) {
            ttl = ttl || IndexedDB.cacheObjectStores.get(storeName);
            expiry = Timestamp.now() + ttl;

            if (!timestampedEntry) {
                expiryKeys.push(storeName);
            }
        }

        if (multiple) {
            if (Array.isArray(data)) {
                data.forEach(nonAssociativeData);
            } else if (typeof data === "object") {
                let entries = data instanceof Map ? data.entries() : Object.entries(data);
                for (let [key, value] of entries) {
                    tx.store.put(value, key).then(key => { if (timestampedEntry) { expiryKeys.push(`${storeName}_${key}`); } });
                }
            } else {
                console.warn("multiple parameter specified but the data is a primitive");
            }
        } else {
            nonAssociativeData(data);
        }

        await tx.done;

        expiryTx = IndexedDB.db.transaction("expiries", "readwrite");

        for (let key of expiryKeys) {
            expiryTx.store.put(expiry, key);
        }

        return expiryTx;
    }

    static async get(storeName, key, options = {}) {
        let keys = IndexedDB._asArray(key);
        let values;
        let store;

        await Promise.all([
            IndexedDB.checkStoreExpiry(storeName, options),
            IndexedDB.checkEntryExpiry(storeName, keys, options),
        ]);

        store = IndexedDB.db.transaction(storeName).store;

        values = await Promise.all(keys.map(key => store.get(key)));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async getAll(storeName, options = {}) {
        let keys = [];
        let values = [];
        let cursor;

        await IndexedDB.checkStoreExpiry(storeName, options);

        if (IndexedDB.timestampedEntriesStores.has(storeName)) {
            await checkEntryExpiry(storeName, await IndexedDB.db.getAllKeys(storeName), options);
        }

        cursor = await IndexedDB.db.transaction(storeName).store.openCursor();
        
        while (cursor) {
            keys.push(cursor.key);
            values.push(cursor.value);
                      
            cursor = await cursor.continue();
        }

        return IndexedDB._resultsAsObject(keys, await Promise.all(values));
    }

    static async getFromIndex(storeName, indexName, key, options = {}) {

        // It doesn't make sense to query on an index from a timestamped entry store, since the data is not complete
        if (IndexedDB.timestampedEntriesStores.has(storeName)) { return; }

        let keys = IndexedDB._asArray(key);
        let values;
        let index;

        await IndexedDB.checkStoreExpiry(storeName, options);

        index = IndexedDB.db.transaction(storeName).store.index(indexName);

        values = await Promise.all(keys.map(key => {
            if (options.asKey) {
                if (options.all) {
                    return index.getAllKeys(key);
                }
                return index.getKey(key);
            }

            if (options.all) {
                return index.getAll(key);
            }

            return index.get(key);
        }));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async indexContainsKey(storeName, indexName, key, options = {}) {

        // It doesn't make sense to query on an index from a timestamped entry store, since the data is not complete
        if (IndexedDB.timestampedEntriesStores.has(storeName)) { return; }

        let keys = IndexedDB._asArray(key);
        let values;
        let index;

        await IndexedDB.checkStoreExpiry(storeName, options);

        index = IndexedDB.db.transaction(storeName).store.index(indexName);

        values = await Promise.all(keys.map(key =>
            index.openKeyCursor(key)
                .then(cursor => Boolean(cursor))
        ));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static delete(storeName, key) {

        let keys = IndexedDB._asArray(key);
        let dataStore = IndexedDB.db.transaction(storeName, "readwrite").store;
        let expiryStore;
        
        if (IndexedDB.cacheObjectStores.has(storeName)) {
            expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        }

        return Promise.all(keys.map(key => {
            let dataPromise = dataStore.delete(key);
            if (expiryStore) {
                return Promise.all([
                    dataPromise,
                    expiryStore.delete(IndexedDB.timestampedStores.has(storeName) ? storeName : `${storeName}_${key}`)
                ]);
            }
            return dataPromise;
        }));
    }

    static clear(storeName = Array.from(IndexedDB.cacheObjectStores.keys())) {
        let storeNames = IndexedDB._asArray(storeName);
        let expiryStore;

        if (storeNames.some(storeName => IndexedDB.cacheObjectStores.has(storeName))) {
            expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        }

        return Promise.all(storeNames.map(storeName => {
            let clearPromise = IndexedDB.db.clear(storeName);

            if (IndexedDB.cacheObjectStores.has(storeName)) {

                let expiryKey;
                if (IndexedDB.timestampedStores.has(storeName)) {
                    expiryKey = storeName;
                } else {
                    expiryKey = IDBKeyRange.bound(`${storeName}_`, `${storeName}${String.fromCharCode('_'.charCodeAt(0) + 1)}`, false, true);
                }

                return Promise.all([
                    clearPromise,
                    expiryStore.delete(expiryKey),
                ]);
            }

            return clearPromise;
        }));
    }

    static async contains(storeName, key, options = {}) {
        let keys = IndexedDB._asArray(key);
        let values;
        let store;

        await Promise.all([
            IndexedDB.checkStoreExpiry(storeName, options),
            IndexedDB.checkEntryExpiry(storeName, keys, options),
        ]);
        
        store = IndexedDB.db.transaction(storeName).store;

        values = await Promise.all(keys.map(key => 
            store.openCursor(key)
                .then(cursor => Boolean(cursor))
        ));
        
        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async checkEntryExpiry(storeName, keys, options = {}) {
        let tx;
        let expired;

        if (!IndexedDB.timestampedEntriesStores.has(storeName)) { return; }

        tx = IndexedDB.db.transaction("expiries");
        expired = [];

        for (let key of keys) {
            tx.store.get(`${storeName}_${key}`).then(expiry => {
                if (!expiry || IndexedDB.isExpired(expiry)) {
                    expired.push(key);
                }
            });
        }

        await tx.done;

        if (options.preventFetch) {
            let dataTx = IndexedDB.db.transaction(storeName, "readwrite");

            for (let key of expired) {
                dataTx.store.delete(key);
            }

            return dataTx.done;
        }

        return Promise.all(expired.map(key => 
            IndexedDB.fetchUpdatedData(storeName, key, options.params)
        ));
    }

    static async checkStoreExpiry(storeName, options = {}) {
        
        if (!IndexedDB.timestampedStores.has(storeName)) return;
        
        let expiry = await IndexedDB.db.get("expiries", storeName);
        let expired = true;

        if (expiry) {
            expired = IndexedDB.isExpired(expiry);
        }

        if (expired) {
            await IndexedDB.clear(storeName);
            if (!options.preventFetch) {
                return IndexedDB.fetchUpdatedData(storeName, null, options.params);
            }
        }
    }

    static fetchUpdatedData(storeName, key, params) {

        let requestKey = key ? `${storeName}_${key}` : storeName;
        if (IndexedDB._ongoingRequests.has(requestKey)) {
            return IndexedDB._ongoingRequests.get(requestKey);
        }

        let req;
        let timestampedStore = IndexedDB.timestampedStores.has(storeName);
        if (timestampedStore) {
            req = IndexedDB.objStoreFetchFns.get(storeName)({ params });
        } else {
            req = IndexedDB.objStoreFetchFns.get(storeName)({ params, key });
        }
        req = req
            .catch(async err => {
                console.group("Object store data");
                if (key) {
                    console.error("Failed to update key %s of object store %s", key, storeName);
                } else {
                    console.error("Failed to update object store %s", storeName);
                }
                console.error(err);
                console.groupEnd();

                // Wait some seconds before retrying
                await IndexedDB.db.put("expiries", Timestamp.now() + 60, timestampedStore ? storeName : `${storeName}_${key}`);

                throw err;
            })
            .finally(() => IndexedDB._ongoingRequests.delete(requestKey));
        IndexedDB._ongoingRequests.set(requestKey, req);
        return req;        
    }

    static isExpired(expiry) {
        return expiry <= Timestamp.now();
    }

    static _asArray(key) {
        return Array.isArray(key) ? key : [key];
    }

    static _resultsAsObject(keys, values) {
        return keys.reduce((acc, key, i) => {
            acc[key] = values[i];
            return acc;
        }, {});
    }
}
IndexedDB._promise = null;
IndexedDB._ongoingRequests = new Map();

/*  Object stores in this map won't get checked
    for timestamps if cached.
    Instead of checking the single entry, the object store itself has
    a entry named "expiry".

    This allows us to reduce the overhead of having one timestamp for
    each individual entry, although they're basically fetched during
    the same time.
*/
IndexedDB.timestampedStores = new Map([
    ["coupons", 60 * 60],
    ["giftsAndPasses", 60 * 60],
    ["items", 60 * 60],
    ["earlyAccessAppids", 60 * 60],
    ["purchases", 24 * 60 * 60],
    ["dynamicStore", 15 * 60],
    ["rates", 60 * 60],
    ["collection", 15 * 60],
    ["waitlist", 15 * 60],
]);

IndexedDB.timestampedEntriesStores = new Map([
    ["packages", 7 * 24 * 60 * 60],
    ["storePageData", 60 * 60],
    ["profiles", 24 * 60 * 60],
    ["workshopFileSizes", 5 * 24 * 60 * 60],
    ["reviews", 60 * 60],
]);

IndexedDB.cacheObjectStores = new Map([...IndexedDB.timestampedStores, ...IndexedDB.timestampedEntriesStores]);

// Functions that are called when an object store (or one of its entries) has expired
IndexedDB.objStoreFetchFns = new Map([
    ["coupons", SteamCommunity.coupons],
    ["giftsAndPasses", SteamCommunity.giftsAndPasses],
    ["items", SteamCommunity.items],
    ["workshopFileSizes", SteamCommunity.fetchWorkshopFileSize],
    ["reviews", SteamCommunity.fetchReviews],
    ["earlyAccessAppids", AugmentedSteamApi.endpointFactoryCached("v01/earlyaccess", "earlyAccessAppids")],
    ["purchases", SteamStore.purchaseDate],
    ["dynamicStore", SteamStore.dynamicStore],
    ["packages", SteamStore.fetchPackage],
    ["storePageData", AugmentedSteamApi.endpointFactoryCached("v01/storepagedata", "storePageData")],
    ["profiles", AugmentedSteamApi.endpointFactoryCached("v01/profile/profile", "profiles")],
    ["rates", AugmentedSteamApi.endpointFactoryCached("v01/rates", "rates")],
    ["collection", ITAD_Api.endpointFactoryCached("v02/user/coll/all", "collection", ITAD_Api.mapCollection)],
    ["waitlist", ITAD_Api.endpointFactoryCached("v01/user/wait/all", "waitlist", ITAD_Api.mapWaitlist)],
]);

let actionCallbacks = new Map([
    ["wishlist.add", SteamStore.wishlistAdd],
    ["wishlist.remove", SteamStore.wishlistRemove],
    ["dynamicstore.clear", SteamStore.clearDynamicStore],
    ["steam.currencies", Steam.currencies],

    ["migrate.notesToSyncedStorage", AugmentedSteam.moveNotesToSyncedStorage],
    ["cache.clear", AugmentedSteam.clearCache],

    ["dlcinfo", AugmentedSteamApi.endpointFactory("v01/dlcinfo")],
    ["storepagedata", AugmentedSteamApi.storePageData],
    ["storepagedata.expire", AugmentedSteamApi.expireStorePageData],
    ["prices", AugmentedSteamApi.endpointFactory("v01/prices")],
    ["rates", AugmentedSteamApi.rates],
    ["isea", AugmentedSteamApi.isEA],
    ["profile.background", AugmentedSteamApi.endpointFactory("v01/profile/background/background")],
    ["profile.background.games", AugmentedSteamApi.endpointFactory("v01/profile/background/games")],
    ["twitch.stream", AugmentedSteamApi.endpointFactory("v01/twitch/stream")],
    ["market.cardprices", AugmentedSteamApi.endpointFactory("v01/market/cardprices")],
    ["market.averagecardprice", AugmentedSteamApi.endpointFactory("v01/market/averagecardprice")], // FIXME deprecated
    ["market.averagecardprices", AugmentedSteamApi.endpointFactory("v01/market/averagecardprices")],
    ["steampeek", AugmentedSteamApi.steamPeek],

    ["appdetails", SteamStore.appDetails],
    ["appuserdetails", SteamStore.appUserDetails],
    ["currency", SteamStore.currency],
    ["sessionid", SteamStore.sessionId],
    ["wishlists", SteamStore.wishlists],
    ["purchases", SteamStore.purchases],
    ["clearpurchases", SteamStore.clearPurchases],
    ["dynamicstorestatus", SteamStore.dsStatus],
    ["dynamicStore.randomApp", SteamStore.dynamicStoreRandomApp],

    ["login", SteamCommunity.login],
    ["logout", SteamCommunity.logout],
    ["storecountry", SteamCommunity.storeCountry],
    ["cards", SteamCommunity.cards],
    ["stats", SteamCommunity.stats],
    ["coupon", SteamCommunity.getCoupon],
    ["hasgiftsandpasses", SteamCommunity.hasGiftsAndPasses],
    ["hascoupon", SteamCommunity.hasCoupon],
    ["hasitem", SteamCommunity.hasItem],
    ["profile", SteamCommunity.getProfile],
    ["clearownprofile", SteamCommunity.clearOwn],
    ["workshopfilesize", SteamCommunity.getWorkshopFileSize],
    ["reviews", SteamCommunity.getReviews],
    ["updatereviewnode", SteamCommunity.updateReviewNode],

    ["itad.authorize", ITAD_Api.authorize],
    ["itad.disconnect", ITAD_Api.disconnect],
    ["itad.isconnected", ITAD_Api.isConnected],
    ["itad.import", ITAD_Api.import],
    ["itad.sync", ITAD_Api.sync],
    ["itad.lastimport", ITAD_Api.lastImport],
    ["itad.inwaitlist", ITAD_Api.inWaitlist],
    ["itad.addtowaitlist", ITAD_Api.addToWaitlist],
    ["itad.removefromwaitlist", ITAD_Api.removeFromWaitlist],
    ["itad.incollection", ITAD_Api.inCollection],
    ["itad.getfromcollection", ITAD_Api.getFromCollection],

    ["error.test", () => { return Promise.reject(new Error("This is a TEST Error. Please ignore.")); }],
]);
// new Map() for Map.prototype.get() in lieu of:
// Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (!sender || !sender.tab) { return; } // not from a tab, ignore
    if (!message || !message.action) { return; }
  
    let callback = actionCallbacks.get(message.action);
    if (!callback) {
        // requested action not recognized, reply with error immediately
        throw new Error(`Did not recognize "${message.action}" as an action.`);
    }

    message.params = message.params || [];
    let res;
    try {
        await Promise.all([IndexedDB, SyncedStorage]);
        res = await callback(...message.params);
    } catch(err) {
        console.group(`Callback: "${message.action}"`);
        console.error(`Failed to execute callback "%s" with params %o`, message.action, message.params);
        console.error(err);
        console.groupEnd();
        
        throw { "message": err.toString() };
    }
    return res;
});

browser.runtime.onStartup.addListener(ContextMenu.update);
browser.runtime.onInstalled.addListener(ContextMenu.update);

browser.contextMenus.onClicked.addListener(ContextMenu.onClick);
