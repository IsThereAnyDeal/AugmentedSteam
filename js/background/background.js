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
    static endpointFactoryCached(endpoint, objectStoreName, multiple, oneDimensional, resultFn) {
        return async (params, dbKey) => {
            let result = await this.getEndpoint(endpoint, params);

            let finalResult;
            if (resultFn) {
                finalResult = resultFn(result.data);
            } else {
                finalResult = result.data;
            }
            
            if (!dbKey) {
                dbKey = Object.keys(finalResult).map(key => {
                    let intKey = Number(key);
                    if (intKey && intKey <= Number.MAX_SAFE_INTEGER) {
                        return intKey;
                    }
                    return key;
                });
                finalResult = Object.values(finalResult);
            } else {
                let intKey = Number(dbKey);
                if (intKey && intKey <= Number.MAX_SAFE_INTEGER) {
                    dbKey = intKey;
                }
            }
            return IndexedDB.putCached(
                objectStoreName,
                oneDimensional ? null : finalResult,
                oneDimensional ? finalResult : dbKey,
                multiple,
            );
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
        return IndexedDB.get("storePageData", appid, params);
    }

    static expireStorePageData(appid) {
        return IndexedDB.delete("storePageData", `app_${appid}`);
    }

    static rates(to) { return IndexedDB.getAll("rates", { "to": to.sort().join(',') }) }
    static isEA(appids) { return IndexedDB.contains("earlyAccessAppids", appids) }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();

class ITAD_Api extends Api {

    static async authorize() {
        let rnd = crypto.getRandomValues(new Uint32Array(1))[0];
        let redirectURI = "https://isthereanydeal.com/connectaugmentedsteam";

        // https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/K8njaUCU81c/eUxMIEACAQAJ

        function noop() {}

        // https://stackoverflow.com/a/58577052
        browser.runtime.onConnect.addListener(noop);

        // For some reason the scripts are not inserted on FF, but this doesn't really matter since FF doesn't support event pages. Therefore the event listeners never get unloaded.
        document.body.appendChild(document.createElement("iframe")).src = "background-iframe.html";

        let tab = await browser.tabs.create({ "url": `${Config.ITAD_ApiServerHost}/oauth/authorize/?client_id=${Config.ITAD_ClientID}&response_type=token&state=${rnd}&scope=${encodeURIComponent(ITAD_Api.requiredScopes.join(' '))}&redirect_uri=${encodeURIComponent(redirectURI)}` });

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

                browser.webRequest.onBeforeRequest.addListener(webRequestListener, { "urls": [
                    redirectURI,        // For Chrome, seems to not support match patterns (probably a problem with the Polyfill?)
                    `${redirectURI}#*`  // For Firefox
                ], "tabId": tab.id }, ["blocking"]);
                browser.tabs.onRemoved.addListener(tabsListener);
            });
        } finally {
            browser.runtime.onConnect.removeListener(noop);
            document.querySelector("iframe").remove();
        }        

        let hashFragment = new URL(url).hash;
        let params = new URLSearchParams(hashFragment.substr(1));

        if (parseInt(params.get("state")) !== rnd) { throw new Error("Failed to verify state parameter from URL fragment"); }

        let accessToken = params.get("access_token");
        let expiresIn = params.get("expires_in");

        if (!accessToken || !expiresIn) { throw new Error(`Couldn't retrieve information from URL fragment "${hashFragment}"`); }
            
        LocalStorage.set("access_token", { token: accessToken, expiry: Timestamp.now() + parseInt(expiresIn, 10) });
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

    static endpointFactoryCached(endpoint, objectStore, multiple, oneDimensional, resultFn) {
        return async (params, dbKey) => {
            if (ITAD_Api.isConnected()) {
                return super.endpointFactoryCached(endpoint, objectStore, multiple, oneDimensional, resultFn)(Object.assign(params || {}, { access_token: ITAD_Api.accessToken }), dbKey);
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

        if (Array.isArray(appids)) {
            appids.forEach(appid => {
                waitlistJSON.data.push({
                    "gameid": ["steam", `app/${appid}`],
                });
            });
        } else {
            waitlistJSON.data[0] = {
                "gameid": ["steam", `app/${appids}`],
            }
        }

        await ITAD_Api.postEndpoint("v01/waitlist/import/", { "access_token": ITAD_Api.accessToken }, null, { "body": JSON.stringify(waitlistJSON) });
        return IndexedDB.put("waitlist", null, appids, Array.isArray(appids));
    }

    static async removeFromWaitlist(appids) {
        if (!appids || (Array.isArray(appids) && !appids.length)) {
            throw new Error("Can't remove nothing from ITAD Waitlist!");
        }
        appids = Array.isArray(appids) ? appids : [appids];
        let storeids = appids.map(appid => `app/${appid}`);
        await ITAD_Api.deleteEndpoint("v02/user/wait/remove/", { "access_token": ITAD_Api.accessToken, "shop": "steam", "ids": storeids.join() });
        return IndexedDB.delete("waitlist", appids);
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
                    .then(() => IndexedDB.put("itadImport", [ownedApps, ownedPackages], ["lastOwnedApps", "lastOwnedPackages"], true)));
            }
        }

        if (SyncedStorage.get("itad_import_wishlist")) {
            let [{ wishlisted }, { lastWishlisted }] = result;
            let newWishlisted = removeDuplicates(wishlisted, lastWishlisted);
            if (newWishlisted.length) {
                promises.push(ITAD_Api.addToWaitlist(newWishlisted)
                    .then(() => IndexedDB.put("itadImport", wishlisted, "lastWishlisted")));
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
            IndexedDB.clear("waitlist").then(() => IndexedDB.objStoreFetchFns.get("waitlist")({ "shop": "steam", "optional": "gameid" })),
            IndexedDB.clear("collection").then(() => IndexedDB.objStoreFetchFns.get("collection")({ "shop": "steam", "optional": "gameid,copy_type" })),
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

    static inWaitlist(storeIds) { return IndexedDB.contains("waitlist", storeIds, { "shop": "steam", "optional": "gameid" }) }
    static inCollection(storeIds) { return IndexedDB.contains("collection", storeIds, { "shop": "steam", "optional": "gameid,copy_type" }) }
    static getFromCollection(storeId) { return IndexedDB.get("collection", storeId, { "shop": "steam", "optional": "gameid,copy_type" }) }
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
        let selectionText = encodeURIComponent(info.selectionText.trim());

        switch (info.menuItemId) {
            case "context_steam_store":
                browser.tabs.create({ url: `https://store.steampowered.com/search/?term=${selectionText}` });
                break;
            case "context_steam_market":
                browser.tabs.create({ url: `https://steamcommunity.com/market/search?q=${selectionText}` });
                break;
            case "context_itad":
                browser.tabs.create({ url: `https://isthereanydeal.com/search/?q=${selectionText}` });
                break;
            case "context_bartervg":
                browser.tabs.create({ url: `https://barter.vg/search?q=${selectionText}` });
                break;
            case "context_steamdb":
                browser.tabs.create({ url: `https://steamdb.info/search/?q=${selectionText}` });
                break;
            case "context_steamdb_instant":
                browser.tabs.create({ url: `https://steamdb.info/instantsearch/?query=${selectionText}` });
                break;
            case "context_steam_keys":
                let steamkeys = info.selectionText.match(/[A-Z0-9]{5}(-[A-Z0-9]{5}){2}/g);
                if (!steamkeys || steamkeys.length === 0) {
                    window.alert(Localization.str.options.no_keys_found);
                    return;
                }
                steamkeys.forEach(steamkey => browser.tabs.create({ url: `https://store.steampowered.com/account/registerkey?key=${encodeURIComponent(steamkey)}` }));
                break;
        }
    }
    
    static build() {
        if (!browser.contextMenus) { return; }
        let options = ["context_steam_store", "context_steam_market", "context_itad", "context_bartervg", "context_steamdb", "context_steamdb_instant", "context_steam_keys"];

        for (let option of options) {
            if (!SyncedStorage.get(option)) { continue; }

            browser.contextMenus.create({
                "id": option,
                "title": Localization.str.options[option].replace("__query__", "%s"),
                "contexts": ["selection"]
            });
        }
    }
    
    static update() {
        if (!browser.contextMenus) { return; }
        browser.contextMenus.removeAll().then(ContextMenu.build);

        if (!ContextMenu._listenerRegistered) {
            browser.contextMenus.onClicked.addListener(ContextMenu.onClick);
            ContextMenu._listenerRegistered = true;
        }
    }

    static async init() {
        await Localization;
        ContextMenu.update();
    }
}
ContextMenu._listenerRegistered = false;


class SteamStore extends Api {
    // static origin = "https://store.steampowered.com/";
    // static params = { 'credentials': 'include', };
    // static _progressingRequests = new Map();

    static async fetchPackage(params, subid) {
        let data = await SteamStore.getEndpoint("/api/packagedetails/", { "packageids": subid, });
        let promises = [];
        for (let [subid, details] of Object.entries(data)) {
            if (details && details.success) {
                let appids = details.data.apps.map(obj => obj.id);
                // .apps is an array of { 'id': ##, 'name': "", }
                promises.push(IndexedDB.putCached("packages", appids, Number(subid)));
            }
        }
        return Promise.all(promises);
    }
    
    static async wishlistAdd(params) {
        return SteamStore.postEndpoint("/api/addtowishlist", params);
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
        let currency = CacheStorage.get("currency", 3600);
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
        let html = await self.getPage("/account/change_country/");
        let dummyPage = HTMLParser.htmlToDOM(html);

        let node = dummyPage.querySelector("#dselect_user_country");
        if (node && node.value)
            return node.value;
        throw new Error("Could not retrieve country");
    }

    static async sessionId() {
        let self = SteamStore;
        // TODO what's the minimal page we can load here to get sessionId?
        let html = await self.getPage("/news/");
        return HTMLParser.getVariableFromText(html, "g_sessionID", "string");
    }
    
    static async purchaseDate(lang) {
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
        let purchaseDates = [];
        let keys = [];

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
            keys.push(appName);
            purchaseDates.push(node.textContent);
        }

        return IndexedDB.putCached("purchases", purchaseDates, keys, true);
    }

    static purchases(appName, lang) { return IndexedDB.get("purchases", appName, lang) }
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

        return IndexedDB.putCached("dynamicStore", Object.values(dynamicStore), Object.keys(dynamicStore), true);
    }

    static dsStatus(ids) { return IndexedDB.getAllFromIndex("dynamicStore", "appid", ids, true) }
    
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
                    throw new CommunityLoginError(`Can't access resource at ${res.url}, HTTP 403`);
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
        let coupons = {};
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
                    if (!coupons[packageid] || coupons[packageid].discount < coupon.discount) {
                        coupons[packageid] = coupon;
                    }
                }
            }
        }

        let packages = await IndexedDB.get("packages", Object.keys(coupons).map(key => Number(key)));

        for (let [subid, coupon] of Object.entries(coupons)) {
            let details = packages[subid];
            if (details) {
                coupon.appids = details;
            } else {
                coupon.appids = [];
            }
        }

        return IndexedDB.putCached("coupons", Object.values(coupons), Object.keys(coupons).map(key => Number(key)), true);
    }

    static getCoupon(appids) { return IndexedDB.getFromIndex("coupons", "appid", appids) }
    static hasCoupon(appids) { return IndexedDB.indexContainsKey("coupons", "appid", appids) }

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

        return IndexedDB.putCached("giftsAndPasses", Object.values(data), Object.keys(data), true);
    }

    static async hasGiftsAndPasses(appid) { return IndexedDB.getAllFromIndex("giftsAndPasses", "appid", appid, true) }

    static async items() { // context#6, community items
        // only used for market highlighting
        let data = await SteamCommunity.getInventory(6);
        if (data) {
            return IndexedDB.putCached("items", null, data.descriptions.map(item => item.market_hash_name), true);
        }
    }

    static hasItem(hashes) { return IndexedDB.contains("items", hashes) }

    /**
     * Invoked when the content script thinks the user is logged in
     * If we don't know the user's steamId, fetch their community profile
     */
    static async login(path) {
        let self = SteamCommunity;
        if (!path) {
            self.logout();
            throw new Error("Login endpoint needs profile url");
        }
        let url = new URL(path, "https://steamcommunity.com/");
        if (!path.startsWith('/id/') && !path.startsWith('/profiles/')) {
            self.logout();
            throw new Error(`Could not interpret '${path}' as a profile`);
        }
        let login = LocalStorage.get('login');
        if (login && login.profilePath === path) {
            // Profile path from the currently loading page matches existing login information, return cached steamId
            return login;
        }

        // New login; retrieve steamId from community profile
        let html = await self.getPage(url);
        let steamId = (html.match(/"steamid":"(\d+)"/) || [])[1];
        if (!steamId) {
            // Couldn't retrieve steamId, probably not logged in
            self.logout();
            return;
        }

        let value = { 'steamId': steamId, 'profilePath': path, };
        LocalStorage.set('login', value);

        // As this is a new login, also retrieve country information from store account page
        value.userCountry = await (SteamStore.country().catch(err => undefined));
        return value;
    }

    static logout() {
        LocalStorage.remove("login");
    }

    static getProfile(steamId) { return IndexedDB.get("profiles", steamId, { "profile": steamId }) }
    static clearOwn(steamId) { return IndexedDB.delete("profiles", steamId) }

    static getPage(endpoint, query) {
        return this._fetchWithDefaults(endpoint, query, { method: 'GET' }).then(response => {
            if (response.url.startsWith("https://steamcommunity.com/login/")) {
                throw new CommunityLoginError("Got redirected onto login page, the user is not logged into steamcommunity.com");
            }
            return response.text();
        });
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
        return IndexedDB._promise = async () => {
            IndexedDB.db = await idb.openDB("Augmented Steam", Info.db_version, {
                upgrade(db, oldVersion) {
                    switch(oldVersion) {
                        case 0: {
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
                            break;
                        }
                        default: {
                            console.warn("Unknown oldVersion", oldVersion);
                            break;
                        }
                    }
                },
                blocked() {
                    console.error("Failed to upgrade database, there is already an open connection");
                },
            });
        };
    }
    static then(onDone, onCatch) {
        return (IndexedDB.init())().then(onDone, onCatch);
    }

    static putCached(objectStoreName, data, key, multiple) {
        return IndexedDB.put(objectStoreName, data, key, multiple, true);
    }

    static async put(objectStoreName, data, key, multiple, cached) {
        if (cached) {
            let ttl = IndexedDB.cacheObjectStores.get(objectStoreName);
            let expiry = Timestamp.now() + ttl;
            if (IndexedDB.timestampedObjectStores.has(objectStoreName)) {
                await IndexedDB.db.put(objectStoreName, expiry, "expiry");
            } else {
                if (multiple) {
                    if (data) data.map(value => ({ "value": value, "expiry": expiry }));
                } else {
                    data = { "value": data, "expiry": expiry };
                }
            }
        }
        if (multiple) {
            let promises = [];
            if (key) {
                for (let i = 0; i < key.length; ++i) {
                    if (data) {
                        promises.push(IndexedDB.db.put(objectStoreName, data[i], key[i]));
                    } else {
                        promises.push(IndexedDB.db.put(objectStoreName, null, key[i]));
                    }
                }
            } else {
                data.forEach(value => promises.push(IndexedDB.db.put(objectStoreName, value)));
            }
            return Promise.all(promises);
        } else {
            if (key) {
                if (data) {
                    return IndexedDB.db.put(objectStoreName, data, key);
                } else {
                    return IndexedDB.db.put(objectStoreName, null, key);
                }
            } else {
                return IndexedDB.db.put(objectStoreName, data);
            }
        }
    }

    static async get(objectStoreName, key, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        if (Array.isArray(key)) {
            let promises = [];
            for (let i = 0; i < key.length; ++i) {
                promises.push(IndexedDB.db.get(objectStoreName, key[i])
                    .then(result => IndexedDB.resultExpiryCheck(result, objectStoreName, key[i], params)));
            }
            let resolved = await Promise.all(promises);
            return key.reduce((acc, cur, i) => {
                acc[cur] = resolved[i];
                return acc;
            }, {});
        } else {
            return IndexedDB.db.get(objectStoreName, key)
                .then(result => IndexedDB.resultExpiryCheck(result, objectStoreName, key, params));
        }
    }

    static async getAll(objectStoreName, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        let cursor = await IndexedDB.db.transaction(objectStoreName).store.openCursor();

        let promises = [];
        let keys = [];
        while (cursor) {
            if (cursor.key !== "expiry") {
                keys.push(cursor.key);
                promises.push(IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params));
            }            
            cursor = await cursor.continue();
        }
        return (await Promise.all(promises)).reduce((acc, cur, i) => {
            acc[keys[i]] = cur;
            return acc;
        }, {});
    }

    static async getFromIndex(objectStoreName, indexName, key, asKey, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        let cursor = await IndexedDB.db.transaction(objectStoreName).store.index(indexName).openCursor(key);
        return IndexedDB.resultExpiryCheck(cursor && cursor.value, objectStoreName, cursor && cursor.primaryKey, params)
            .then(result => {
                if (result && asKey) {
                    return cursor.key;
                } else {
                    return result;
                }
            });
    }

    static async getAllFromIndex(objectStoreName, indexName, key, asKey, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        let promises = [];
        if (Array.isArray(key)) {
            let index = IndexedDB.db.transaction(objectStoreName).store.index(indexName);
            key.forEach(_key => {
                promises.push((async () => {
                    let cursorPromises = [];
                    let cursor = await index.openCursor(_key);
                    while (cursor) {
                        cursorPromises.push(IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.primaryKey, params)
                            .then(result => {
                                if (result && asKey) {
                                    return cursor.primaryKey;
                                } else {
                                    return result;
                                }
                            }));
                        cursor = await cursor.continue();
                    }
                    return Promise.all(cursorPromises);
                })());
            });

            let resolved = await Promise.all(promises);
            return key.reduce((acc, cur, i) => {
                acc[cur] = resolved[i];
                return acc;
            }, {});
        } else {
            let cursor = await IndexedDB.db.transaction(objectStoreName).store.index(indexName).openCursor(key);
            while (cursor) {
                promises.push(IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.primaryKey, params)
                    .then(result => {
                        if (result && asKey) {
                            return cursor.primaryKey;
                        } else {
                            return result;
                        }
                    }));
                cursor = await cursor.continue();
            }
        }
        
        return Promise.all(promises);
    }

    static async indexContainsKey(objectStoreName, indexName, key, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        if (Array.isArray(key)) {
            let promises = [];
            let index = IndexedDB.db.transaction(objectStoreName).store.index(indexName);
            key.forEach(_key => {
                if (_key) {
                    promises.push(index.openCursor(_key)
                        .then(cursor => {
                            if (cursor) {
                                return IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.primaryKey, params);
                            }
                        })
                        .then(result => typeof result !== "undefined")
                    );
                } else {
                    promises.push(Promise.resolve(false));
                }
            });

            let resolved = await Promise.all(promises);
            return key.reduce((acc, cur, i) => {
                acc[cur] = resolved[i];
                return acc;
            }, {});
        } else {
            if (!key) return false;
            let cursor = await IndexedDB.db.transaction(objectStoreName).store.index(indexName).openCursor(key);
            
            let result;
            if (cursor) {
                result = await IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.primaryKey, params);
            }
            return typeof result !== "undefined";
        }
    }

    static delete(objectStoreName, keys) {
        keys = Array.isArray(keys) ? keys : [keys];

        let promises = [];
        for (let key of keys) {
            promises.push(IndexedDB.db.delete(objectStoreName, key));
        }
        return Promise.all(promises);
    }

    static clear(objectStoreNames) {
        let objectStores = objectStoreNames || Array.from(IndexedDB.cacheObjectStores.keys());
        let multiple = Array.isArray(objectStores);

        if (multiple) {
            let promises = [];
            objectStores.forEach(objectStoreName => {
                promises.push(IndexedDB.db.clear(objectStoreName));
            });
            return Promise.all(promises);
        } else {
            return IndexedDB.db.clear(objectStoreNames);
        }
    }

    static async contains(objectStoreName, key, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        if (Array.isArray(key)) {
            let objectStore = IndexedDB.db.transaction(objectStoreName).store;
            let promises = [];
            key.forEach(_key => {
                if (_key) {
                    promises.push(objectStore.openCursor(_key)
                        .then(cursor => {
                            if (cursor) {
                                return IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params);
                            }
                        })
                        .then(result => typeof result !== "undefined")
                    );
                } else {
                    promises.push(Promise.resolve(false));
                }
            });
            
            let resolved = await Promise.all(promises);
            return key.reduce((acc, cur, i) => {
                acc[cur] = resolved[i];
                return acc;
            }, {});
        } else {
            if (!key) return false;
            let cursor = await IndexedDB.db.transaction(objectStoreName).store.openCursor(key);
            
            if (cursor) {
                let result = await IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params);
                return typeof result !== "undefined";
            }
        }
    }

    static async resultExpiryCheck(result, objectStoreName, key, params) {
        if (IndexedDB.timestampedObjectStores.has(objectStoreName) || !IndexedDB.cacheObjectStores.has(objectStoreName)) return result;

        if (!result || IndexedDB.isExpired(result.expiry)) {
            await IndexedDB.fetchUpdatedData(objectStoreName, key, params);
            return IndexedDB.get(objectStoreName, key);
        }

        return result.value;
    }

    static isExpired(expiry) {
        return expiry <= Timestamp.now();
    }

    static async objStoreExpiryCheck(objectStoreName, params) {
        // Remove old entries
        if (IndexedDB.timestampedEntriesObjectStores.has(objectStoreName)) {
            let cursor = await IndexedDB.db.transaction(objectStoreName, "readwrite").store.index("expiry")
                .openCursor(IDBKeyRange.upperBound(Timestamp.now() - IndexedDB.timestampedEntriesObjectStores.get(objectStoreName)));

            while (cursor) {
                await cursor.delete();
                cursor = await cursor.continue();
            }
        }
        
        if (!IndexedDB.timestampedObjectStores.has(objectStoreName)) return;
        
        let expiry = await IndexedDB.db.get(objectStoreName, "expiry");
        let expired;
        if (!expiry) {
            expired = true;
        } else {
            expired = IndexedDB.isExpired(expiry);
        }
        if (expired) {
            await IndexedDB.clear(objectStoreName);
            await IndexedDB.fetchUpdatedData(objectStoreName, null, params);
        }
    }

    static async fetchUpdatedData(objectStoreName, key, params) {
        if (!IndexedDB.cacheObjectStores.has(objectStoreName)) return;

        let requestKey = key ? `${objectStoreName}_${key}` : objectStoreName;
        if (IndexedDB._ongoingRequests.has(requestKey)) {
            return IndexedDB._ongoingRequests.get(requestKey);
        }

        let req;
        if (IndexedDB.timestampedObjectStores.has(objectStoreName)) {
            req = IndexedDB.objStoreFetchFns.get(objectStoreName)(params);
        } else {
            req = IndexedDB.objStoreFetchFns.get(objectStoreName)(params, key);
        }
        req = req
            .then(async () => {
                if (key) {
                    if (!await IndexedDB.db.transaction(objectStoreName).store.openKeyCursor(key)) {
                        // Prevent fetching the same empty result for every db request for this key
                        return IndexedDB.putCached(objectStoreName, null, key);
                    }
                }
            })
            .finally(() => IndexedDB._ongoingRequests.delete(requestKey));
        IndexedDB._ongoingRequests.set(requestKey, req);
        return req;        
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
IndexedDB.timestampedObjectStores = new Map([
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

IndexedDB.timestampedEntriesObjectStores = new Map([
    ["packages", 7 * 24 * 60 * 60],
    ["storePageData", 60 * 60],
    ["profiles", 24 * 60 * 60],
]);

IndexedDB.cacheObjectStores = new Map([...IndexedDB.timestampedObjectStores, ...IndexedDB.timestampedEntriesObjectStores]);

// Functions that are called when an object store (or one of its entries) has expired
IndexedDB.objStoreFetchFns = new Map([
    ["coupons", SteamCommunity.coupons],
    ["giftsAndPasses", SteamCommunity.giftsAndPasses],
    ["items", SteamCommunity.items],
    ["earlyAccessAppids", AugmentedSteamApi.endpointFactoryCached("v01/earlyaccess", "earlyAccessAppids", true, true)],
    ["purchases", SteamStore.purchaseDate],
    ["dynamicStore", SteamStore.dynamicStore],
    ["packages", SteamStore.fetchPackage],
    ["storePageData", AugmentedSteamApi.endpointFactoryCached("v01/storepagedata", "storePageData")],
    ["profiles", AugmentedSteamApi.endpointFactoryCached("v01/profile/profile", "profiles")],
    ["rates", AugmentedSteamApi.endpointFactoryCached("v01/rates", "rates", true)],
    ["collection", ITAD_Api.endpointFactoryCached("v02/user/coll/all", "collection", true, false, ITAD_Api.mapCollection)],
    ["waitlist", ITAD_Api.endpointFactoryCached("v01/user/wait/all", "waitlist", true, true, ITAD_Api.mapWaitlist)],
]);

let actionCallbacks = new Map([
    ["wishlist.add", SteamStore.wishlistAdd],
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

    ["appdetails", SteamStore.appDetails],
    ["appuserdetails", SteamStore.appUserDetails],
    ["currency", SteamStore.currency],
    ["sessionid", SteamStore.sessionId],
    ["purchases", SteamStore.purchases],
    ["clearpurchases", SteamStore.clearPurchases],
    ["dynamicstorestatus", SteamStore.dsStatus],

    ["login", SteamCommunity.login],
    ["logout", SteamCommunity.logout],
    ["cards", SteamCommunity.cards],
    ["stats", SteamCommunity.stats],
    ["coupon", SteamCommunity.getCoupon],
    ["hasgiftsandpasses", SteamCommunity.hasGiftsAndPasses],
    ["hascoupon", SteamCommunity.hasCoupon],
    ["hasitem", SteamCommunity.hasItem],
    ["profile", SteamCommunity.getProfile],
    ["clearownprofile", SteamCommunity.clearOwn],

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
        console.error(`Failed to execute callback ${message.action}: ${err.name}: ${err.message}\n${err.stack}`);
        throw { "message": err.name };
    }
    return res;
});

browser.runtime.onStartup.addListener(ContextMenu.init);
browser.runtime.onInstalled.addListener(ContextMenu.init);
