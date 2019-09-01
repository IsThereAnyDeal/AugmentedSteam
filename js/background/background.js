class CacheStorage {
    static isExpired (timestamp, ttl) {
        if (!timestamp) return true;
        if (typeof ttl != 'number' || ttl < 0) ttl = 0;
        return timestamp + ttl <= window.timestamp();
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

    static set (key, value) {
        localStorage.setItem('cache_' + key, JSON.stringify({ 'data': value, 'timestamp': window.timestamp(), }));
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
    static getEndpoint(endpoint, query, params = {}) {
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        return this._fetchWithDefaults(endpoint, query, Object.assign(params, { 'method': 'GET', })).then(response => response.json());
    }    
    static getPage(endpoint, query, params = {}) {
        return this._fetchWithDefaults(endpoint, query, Object.assign(params, { 'method': 'GET', })).then(response => response.text());
    }
    static postEndpoint(endpoint, query, params = {}) {
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        return this._fetchWithDefaults(endpoint, query, Object.assign(params, { 'method': 'POST', })).then(response => response.json());
    }
    static endpointFactory(endpoint) {
        return async params => this.getEndpoint(endpoint, params).then(result => result.data);
    }
    static endpointFactoryCached(endpoint, objectStoreName, multiple, oneDimensional, resultFn) {
        return async (params, dbKey) => {
            let req = this.getEndpoint(endpoint, params)
                .then(result => {
                    if (resultFn) return resultFn(result.data);
                    return result.data;
                })
                .then(async finalResult => {
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
                    await IndexedDB.putCached(
                        objectStoreName,
                        oneDimensional ? null : finalResult,
                        oneDimensional ? finalResult : dbKey,
                        multiple,
                    );
                });
            return req;
        };
    }

    static clearEndpointCache(keyMapper, objectStore) {
        return async params => {
            let key = keyMapper.map(params, true);
            if (!key) {
                throw new Error(`Can't clear invalid key from cache`);
            }
            this._progressingRequests.delete(key);
            return IndexedDB.delete(objectStore, keyMapper.map(params, false));
        };
    }
}
Api.params = {};


class AugmentedSteamApi extends Api {
    // static origin = Config.ApiServerHost;
    // static _progressingRequests = new Map();
    
    static getEndpoint(endpoint, query) { // withResponse? boolean that includes Response object in result?
        return super.getEndpoint(endpoint, query)
            .then(function(json) {
                if (!json.result || json.result !== "success") {
                    throw new Error(`Could not retrieve '${endpoint}'`);
                }
                delete json.result;
                return json; // 'response': response, 
            });
    }    

    static expireStorePageData(appid) {
        CacheStorage.remove(`app_${appid}`);
    }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();

class ITAD_Api extends Api {

    static authorize(hash) {
        return new Promise(resolve => {
            browser.permissions.request({ permissions: ["identity"] }).then(granted => {
                if (granted) {
                    browser.identity.launchWebAuthFlow({ url: `${Config.ITAD_ApiServerHost}/oauth/authorize/?client_id=${ITAD_Api.clientId}&response_type=token&state=${hash}&scope=${encodeURIComponent(ITAD_Api.requiredScopes.join(' '))}&redirect_uri=https://${browser.runtime.id}.chromiumapp.org/itad`, interactive: true })
                        .then(url => {
                            if (url) {
                                let hashFragment = new URL(url).hash;
                                if (hashFragment) {
                                    let params = new URLSearchParams(hashFragment.substr(1));
        
                                    if (parseInt(params.get("state"), 10) === hash) {
                                        let accessToken = params.get("access_token");
                                        let expiresIn = params.get("expires_in");
            
                                        if (accessToken && expiresIn) {
                                            resolve();
                                            localStorage.setItem("access_token", JSON.stringify({ token: accessToken, expiry: window.timestamp() + parseInt(expiresIn, 10) }));
                                        } else throw new Error("Couldn't retrieve information from URL fragment '" + hashFragment + "'");
                                    } else throw new Error("Failed to verify state parameter from URL fragment");
                                } else throw new Error("URL " + url + " doesn't contain a fragment");
                            } else throw new Error("Couldn't retrieve access token for ITAD authorization");
                        });
                } else throw new Error("Denied accessing identity API, can't authorize app");
            });
        });
    }

    static isConnected() {
        if (ITAD_Api.accessToken) return true;
        let lsEntry = LocalStorage.get("access_token");
        if (!lsEntry) return false;

        if (lsEntry.expiry <= window.timestamp()) {
            LocalStorage.remove("access_token");
            return false;
        }
        ITAD_Api.accessToken = lsEntry.token;
        // todo Periodically sync
        ITAD_Api.sync();
        return true;
    }

    static endpointFactoryCached(endpoint, objectStore, multiple, oneDimensional, resultFn) {
        return async (params, dbKey) => {
            if (ITAD_Api.isConnected()) {
                return super.endpointFactoryCached(endpoint, objectStore, multiple, oneDimensional, resultFn)(Object.assign(params || {}, { access_token: ITAD_Api.accessToken }), dbKey);
            }
        }
    }

    static async sync() {
        let [ownedApps, ownedPackages, wishlistedApps] = await IndexedDB.get("dynamicStore", ["ownedApps", "ownedPackages", "wishlisted"]);
        let [lastOwnedApps, lastOwnedPackages, lastWishlistedApps] = await IndexedDB.get("itadSync", ["lastOwnedApps", "lastOwnedPackages", "lastWishlisted"]);

        let baseJSON = {
            "version": "02",
            "data": [],
        }

        function removeDuplicates(from, other) {
            if (!from) return [];
            if (!other) return from;
            return from.filter(el => !other.includes(el));
        }

        let promises = [];

        let newOwnedApps = removeDuplicates(ownedApps, lastOwnedApps);
        let newOwnedPackages = removeDuplicates(ownedPackages, lastOwnedPackages);
        if (newOwnedApps.length || newOwnedPackages.length) {
            let collectionJSON = JSON.parse(JSON.stringify(baseJSON));
            newOwnedApps.forEach(appid => {
                collectionJSON.data.push({
                    "gameid": ["steam", `app/${appid}`],
                    "copies": [{ "type": "steam" }],
                });
            });

            newOwnedPackages.forEach(subid => {
                collectionJSON.data.push({
                    "gameid": ["steam", `sub/${subid}`],
                    "copies": [{ "type": "steam" }],
                });
            });

            promises.push(this.postEndpoint("v01/collection/import/", { "access_token": this.accessToken }, { "body": JSON.stringify(collectionJSON) })
                .then(() => IndexedDB.put("itadSync", [ownedApps, ownedPackages], ["lastOwnedApps", "lastOwnedPackages"], true)));
        }

        let newWishlistedApps = removeDuplicates(wishlistedApps, lastWishlistedApps);
        if (newWishlistedApps.length) {
            let wailistJSON = JSON.parse(JSON.stringify(baseJSON));
            newWishlistedApps.forEach(appid => {
                wailistJSON.data.push({
                    "gameid": ["steam", `app/${appid}`],
                });
            });

            promises.push(this.postEndpoint("v01/waitlist/import/", { "access_token": this.accessToken }, { "body": JSON.stringify(wailistJSON) })
                .then(() => IndexedDB.put("itadSync", wishlistedApps, "lastWishlisted")));
        }
        return Promise.all(promises);
    }
}
ITAD_Api.accessToken = null;
ITAD_Api.clientId = "5fe78af07889f43a";
ITAD_Api.requiredScopes = [
    "wait_read",
    "wait_write",
    "coll_read",
    "coll_write",
];

ITAD_Api.origin = Config.ITAD_ApiServerHost;
ITAD_Api._progressingRequests = new Map();

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
        let self = SteamStore;
        let cache = CacheStorage.get('currency', 3600);
        if (cache) return cache;
        let currency = await self.currencyFromWallet();
        if (!currency) { currency = await self.currencyFromApp(); }
        if (!currency) { throw new Error("Could not retrieve store currency"); }
        CacheStorage.set('currency', currency);
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
}
SteamStore.origin = "https://store.steampowered.com/";
SteamStore.params = { 'credentials': 'include', };
SteamStore._progressingRequests = new Map();


class SteamCommunity extends Api {
    // static origin = "https://steamcommunity.com/";
    // static params = { 'credentials': 'include', };

    static cards(appid, border) {
        return SteamCommunity.getPage(`/my/gamecards/${appid}`, (border ? { 'border': 1, } : undefined)).catch(() => {
            throw new Error("Could not retrieve cards for appid " + appid);
        });
    }

    static stats(appid) {
        return SteamCommunity.getPage(`/my/stats/${appid}`).catch(() => {
            throw new Error("Could not retrieve stats for appid " + appid);
        });
    }

    static async getInventory(contextId) {
        let login = LocalStorage.get("login");
        if (!login) throw new Error("Must be signed in to access Inventory");

        let params = { "l": "english", "count": 2000 };
        let data = null;
        let result, last_assetid;

        do {
            let thisParams = Object.assign(params, last_assetid ? { "start_assetid": last_assetid } : null);
            result = await SteamCommunity.getEndpoint(`/inventory/${login.steamId}/753/${contextId}`, thisParams);
            if (result && result.success) {
                if (!data) data = { "assets": [], "descriptions": [] };
                if (result.assets) data.assets = data.assets.concat(result.assets);
                if (result.descriptions) data.descriptions = data.descriptions.concat(result.descriptions);
            }
            last_assetid = result.last_assetid;
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

        let packagesKeys = Object.keys(coupons).map(key => Number(key));
        let packagesArr = await IndexedDB.get("packages", packagesKeys);
        
        let packages = packagesArr.reduce((accumulator, current, i) => {
            accumulator[packagesKeys[i]] = current;
            return accumulator;
        }, {});

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
    static async giftsAndPasses() { // context#1, gifts and guest passes
        let gifts = [];
        let passes = [];

        let data = await SteamCommunity.getInventory(1);

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

    static async items() { // context#6, community items
        // only used for market highlighting
        return IndexedDB.putCached("items", null, (await SteamCommunity.getInventory(6)).descriptions.map(item => item.market_hash_name), true);
    }

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

    static getPage(endpoint, query) {
        return this._fetchWithDefaults(endpoint, query, { method: 'GET' }).then(response => {
            if (response.url.startsWith("https://steamcommunity.com/login/")) {
                throw new Error("Got redirected onto login page, the user is not logged into steamcommunity.com")
            }
            return response.text();
        });
    }
}
SteamCommunity.origin = "https://steamcommunity.com/";
SteamCommunity.params = { 'credentials': 'include', };


class Steam {
    // static _dynamicstore_promise = null;
    // static _supportedCurrencies = null;
    
    static async dynamicStore() {
        if (Steam._dynamicstore_promise) return Steam._dynamicstore_promise;

        Steam._dynamicstore_promise = Promise.all([
            SteamStore.getEndpoint("/dynamicstore/userdata/"),
            IndexedDB.getAll("collection", true, { "shop": "steam", "optional": "gameid,copy_type" }),
        ])
        .then(([{ rgOwnedApps, rgOwnedPackages, rgIgnoredApps, rgWishlist }, { games, typemap }]) => {
            if (!rgOwnedApps) {
                throw new Error("Could not fetch DynamicStore UserData");
            }

            let promises = [];
            if (games) {
                let ownedElsewhere = {};
                let includeOtherGames = SyncedStorage.get("include_owned_elsewhere");
                games.forEach(({ gameid, types }) => {
                    types = types.filter(type => type !== "steam");
                    if (!types.length) return;

                    types = types.map(type => typemap[type]);

                    if (includeOtherGames) {
                        if (gameid.startsWith("app/")) {
                            rgOwnedApps.push(Number(gameid.slice(gameid.indexOf('/') + 1)));
                        } else if (gameid.startsWith("sub/")) {
                            rgOwnedPackages.push(Number(gameid.slice(gameid.indexOf('/') + 1)));
                        }
                    }

                    ownedElsewhere[gameid] = types;
                    promises.push(IndexedDB.putCached("ownedElsewhere", Object.values(ownedElsewhere), Object.keys(ownedElsewhere), true));
                });
            }

            let data = {
                "ignored": Object.keys(rgIgnoredApps).map(key => Number(key)),
                "ownedApps": rgOwnedApps,
                "ownedPackages": rgOwnedPackages,
                "wishlisted": rgWishlist,
            };
            promises.push(IndexedDB.putCached("dynamicStore", Object.values(data), Object.keys(data), true));

            return Promise.all(promises);
        })
        .finally(() => Steam._dynamicstore_promise = null);

        return Steam._dynamicstore_promise;
    }
    // dynamicstore keys are:
    // "rgWishlist", "rgOwnedPackages", "rgOwnedApps", "rgPackagesInCart", "rgAppsInCart"
    // "rgRecommendedTags", "rgIgnoredApps", "rgIgnoredPackages", "rgCurators", "rgCurations"
    // "rgCreatorsFollowed", "rgCreatorsIgnored", "preferences", "rgExcludedTags",
    // "rgExcludedContentDescriptorIDs", "rgAutoGrantApps"

    static async clearDynamicStore() {
        await IndexedDB.clear("dynamicStore");
        Steam._dynamicstore_promise = null;
    }

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
Steam._dynamicstore_promise = null;
Steam._supportedCurrencies = null;

class IndexedDB {
    static init() {
        if (!IndexedDB._promise) {
            IndexedDB._promise = async () => {
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
                                db.createObjectStore("packages");
                                db.createObjectStore("storePageData");
                                db.createObjectStore("profiles");
                                db.createObjectStore("rates");
                                db.createObjectStore("notes");
                                db.createObjectStore("collection");
                                db.createObjectStore("waitlist");
                                db.createObjectStore("ownedElsewhere");
                                db.createObjectStore("itadSync").createIndex("id", '', { unique: false, multiEntry: true });
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
        return IndexedDB._promise;
    }
    static then(onDone, onCatch) {
        return IndexedDB.init()().then(onDone, onCatch);
    }

    static putCached(objectStoreName, data, key, multiple) {
        return IndexedDB.put(objectStoreName, data, key, multiple, true);
    }

    static async put(objectStoreName, data, key, multiple, cached) {
        if (cached) {
            let ttl = IndexedDB.cacheObjectStores.get(objectStoreName);
            let expiry = window.timestamp() + ttl;
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
        let multiple = Array.isArray(key);

        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        if (multiple) {
            let promises = [];
            for (let i = 0; i < key.length; ++i) {
                promises.push(IndexedDB.db.get(objectStoreName, key[i])
                    .then(result => IndexedDB.resultExpiryCheck(result, objectStoreName, key[i], params)));
            }
            return Promise.all(promises);
        } else {
            return IndexedDB.db.get(objectStoreName, key)
                .then(result => IndexedDB.resultExpiryCheck(result, objectStoreName, key, params));
        }
    }

    static async getAll(objectStoreName, withKeys, params) {
        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        let cursor = await IndexedDB.db.transaction(objectStoreName).store.openCursor();

        let promises = [];
        let keys;
        if (withKeys) keys = [];
        while (cursor) {
            if (cursor.key !== "expiry") {
                if (withKeys) keys.push(cursor.key);
                promises.push(IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params));
            }            
            cursor = await cursor.continue();
        }
        if (withKeys) {
            return (await Promise.all(promises)).reduce((acc, cur, i) => {
                acc[keys[i]] = cur;
                return acc;
            }, {});
        }
        return Promise.all(promises);
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
        return Promise.all(promises);
    }

    static delete(objectStoreName, key) {
        return IndexedDB.db.delete(objectStoreName, key);
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
        let multiple = Array.isArray(key);

        await IndexedDB.objStoreExpiryCheck(objectStoreName, params);

        if (multiple) {
            let objectStore = IndexedDB.db.transaction(objectStoreName).store;
            let promises = [];
            key.forEach(_key =>
                promises.push(objectStore.openCursor(_key)
                    .then(cursor => {
                        if (cursor) {
                            return IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params);
                        }
                    })
                    .then(result => {
                        if (!IndexedDB.cacheObjectStores.has(objectStoreName) || IndexedDB.timestampedObjectStores.has(objectStoreName)) return typeof result !== "undefined";
                        return Boolean(result.value);
                    })
                )
            );
            
            return Promise.all(promises);
        } else {
            return IndexedDB.db.transaction(objectStoreName).store.openKeyCursor(key)
                .then(cursor => {
                    if (cursor) {
                        return IndexedDB.resultExpiryCheck(cursor.value, objectStoreName, cursor.key, params);
                    }
                })
                .then(result => {
                    if (!IndexedDB.cacheObjectStores.has(objectStoreName) || IndexedDB.timestampedObjectStores.has(objectStoreName)) return typeof result !== "undefined";
                    return Boolean(result.value);
                });
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
        return expiry <= window.timestamp();
    }

    static async objStoreExpiryCheck(objectStoreName, params) {
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
    ["ownedElsewhere", 15 * 60],
    ["rates", 60 * 60],
    ["collection", 15 * 60],
    ["waitlist", 15 * 60],
]);
IndexedDB.cacheObjectStores = new Map([...IndexedDB.timestampedObjectStores,
    ["packages", 7 * 24 * 60 * 60],
    ["storePageData", 60 * 60],
    ["profiles", 24 * 60 * 60],
]);

// Functions that are called when an object store (or one of its entries) has expired
IndexedDB.objStoreFetchFns = new Map([
    ["coupons", SteamCommunity.coupons],
    ["giftsAndPasses", SteamCommunity.giftsAndPasses],
    ["items", SteamCommunity.items],
    ["earlyAccessAppids", AugmentedSteamApi.endpointFactoryCached("v01/earlyaccess", "earlyAccessAppids", true, true)],
    ["purchases", SteamStore.purchaseDate],
    ["dynamicStore", Steam.dynamicStore],
    ["ownedElsewhere", Steam.dynamicStore],
    ["packages", SteamStore.fetchPackage],
    ["storePageData", AugmentedSteamApi.endpointFactoryCached("v01/storepagedata", "storePageData")],
    ["profiles", AugmentedSteamApi.endpointFactoryCached("v01/profile/profile", "profiles")],
    ["rates", AugmentedSteamApi.endpointFactoryCached("v01/rates", "rates", true)],
    ["collection", ITAD_Api.endpointFactoryCached("v02/user/coll/all", "collection", true)],
    ["waitlist", ITAD_Api.endpointFactoryCached("v01/user/wait/all", "waitlist")],
]);

let actionCallbacks = new Map([
    ["wishlist.add", SteamStore.wishlistAdd],
    ["dynamicstore.clear", Steam.clearDynamicStore],
    ["steam.currencies", Steam.currencies],
    
    ["cache.clear", IndexedDB.clear],
    ["dlcinfo", AugmentedSteamApi.endpointFactory("v01/dlcinfo")],
    ["storepagedata.expire", AugmentedSteamApi.expireStorePageData],
    ["prices", AugmentedSteamApi.endpointFactory("v01/prices")],
    ["profile", AugmentedSteamApi.endpointFactoryCached("v01/profile/profile", "profiles")], // todo convert
    //["profile.clear", AugmentedSteamApi.clearEndpointCache(profilesMapper, "profiles")],
    ["profile.background", AugmentedSteamApi.endpointFactory("v01/profile/background/background")],
    ["profile.background.games", AugmentedSteamApi.endpointFactory("v01/profile/background/games")],
    ["twitch.stream", AugmentedSteamApi.endpointFactory("v01/twitch/stream")],
    ["market.cardprices", AugmentedSteamApi.endpointFactory("v01/market/cardprices")],
    ["market.averagecardprice", AugmentedSteamApi.endpointFactory("v01/market/averagecardprice")], // FIXME deprecated
    ["market.averagecardprices", AugmentedSteamApi.endpointFactory("v01/market/averagecardprices")],

    ["appdetails", SteamStore.endpointFactory("api/appdetails/")],
    ["appuserdetails", SteamStore.endpointFactory("api/appuserdetails/")],
    ["currency", SteamStore.currency],
    ["sessionid", SteamStore.sessionId],

    ["login", SteamCommunity.login],
    ["logout", SteamCommunity.logout],
    ["cards", SteamCommunity.cards],
    ["stats", SteamCommunity.stats],

    ["itad.authorize", ITAD_Api.authorize],
    ["itad.isconnected", ITAD_Api.isConnected],

    ["idb.get", IndexedDB.get],
    ["idb.getfromindex", IndexedDB.getFromIndex],
    ["idb.getallfromindex", IndexedDB.getAllFromIndex],
    ["idb.put", IndexedDB.put],
    ["idb.delete", IndexedDB.delete],
    ["idb.clear", IndexedDB.clear],
    ["idb.contains", IndexedDB.contains],

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
    try {
        await Promise.all([IndexedDB, SyncedStorage]);
        return callback(...message.params);
    } catch(err) {
        console.error(`Failed to execute callback ${message.action}: ${err.name}: ${err.message}\n${err.stack}`);
        throw err;
    }
});
