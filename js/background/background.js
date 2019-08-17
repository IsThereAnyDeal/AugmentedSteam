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

class IndexedDB {
    static init() {
        if (!IndexedDB._promise) {
            IndexedDB._promise = async () => {
                IndexedDB.db = await idb.openDB("Augmented Steam", Info.db_version, {
                    upgrade(db, oldVersion) {
                        switch(oldVersion) {
                            case 0: {
                                db.createObjectStore("coupons").createIndex("appid", "appids", { unique: false, multiEntry: true });
                                db.createObjectStore("gifts");
                                db.createObjectStore("passes");
                                db.createObjectStore("items");
                                db.createObjectStore("earlyAccessAppids");
                                db.createObjectStore("purchases");
                                db.createObjectStore("dynamicStore").createIndex("appid", '', { unique: false, multiEntry: true });
                                db.createObjectStore("packages");
                                db.createObjectStore("storePageData");
                                db.createObjectStore("profiles");
                                db.createObjectStore("rates");
                                db.createObjectStore("notes");
                                db.createObjectStore("itad");
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
    static catch(onCatch) {
        return IndexedDB.init()().catch(onCatch);
    }

    static putCached(objectStoreName, data, key, multiple) {
        return IndexedDB.put(objectStoreName, data, key, multiple, true);
    }

    static async put(objectStoreName, data, key, multiple, cached) {
        if (cached) {
            let timestamp = window.timestamp();
            if (IndexedDB.timestampedObjectStores.includes(objectStoreName)) {
                await IndexedDB.db.put(objectStoreName, timestamp, "timestamp");
            } else {
                if (multiple) {
                    if (data) data.map(value => ({ "value": value, "timestamp": timestamp }));
                } else {
                    data = { "value": data, "timestamp": timestamp };
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
                        promises.push(IndexedDB.db.put(objectStoreName, undefined, key[i]));
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
                    return IndexedDB.db.put(objectStoreName, undefined, key);
                }
            } else {
                return IndexedDB.db.put(objectStoreName, data);
            }
        }
    }

    static async get(objectStoreName, key, ttl) {
        let multiple = Array.isArray(key);

        if (await IndexedDB.isObjectStoreExpired(objectStoreName, ttl)) { return; }

        if (multiple) {
            let promises = [];
            for (let i = 0; i < key.length; ++i) {
                promises.push(IndexedDB.db.get(objectStoreName, key[i])
                    .then(result => IndexedDB.resultExpiryCheck(result, ttl, objectStoreName)));
            }
            return Promise.all(promises);
        } else {
            return IndexedDB.db.get(objectStoreName, key)
                .then(result => IndexedDB.resultExpiryCheck(result, ttl, objectStoreName));
        }
    }

    static async getAll(objectStoreName, ttl, withKeys) {
        if (await IndexedDB.isObjectStoreExpired(objectStoreName, ttl)) { return; }

        let cursor = await IndexedDB.db.transaction(objectStoreName).store.openCursor();

        let results = withKeys ? {} : [];
        while (cursor && cursor.key !== "timestamp") {
            if (withKeys) {
                results[cursor.key] = IndexedDB.resultExpiryCheck(cursor.value, ttl, objectStoreName);
            } else {
                results.push(IndexedDB.resultExpiryCheck(cursor.value, ttl, objectStoreName));
            }
            cursor = await cursor.continue();
        }
        return results;
    }

    static async getFromIndex(objectStoreName, indexName, key, ttl, asKey) {
        if (await IndexedDB.isObjectStoreExpired(objectStoreName, ttl)) { return; }

        if (asKey) {
            return IndexedDB.db.getKeyFromIndex(objectStoreName, indexName, key);
        } else {
            return IndexedDB.db.getFromIndex(objectStoreName, indexName, key).then(result => IndexedDB.resultExpiryCheck(result, ttl, objectStoreName));
        }
    }

    static async getAllFromIndex(objectStoreName, indexName, key, ttl, asKey) {
        if (await IndexedDB.isObjectStoreExpired(objectStoreName, ttl)) { return; }

        if (asKey) {
            return IndexedDB.db.getAllKeysFromIndex(objectStoreName, indexName, key);
        } else {
            let results = await IndexedDB.db.getAllFromIndex(objectStoreName, indexName, key);
            return results.map(value => IndexedDB.resultExpiryCheck(value, ttl, objectStoreName));
        }
    }

    static delete(objectStoreName, key) {
        return IndexedDB.db.delete(objectStoreName, key);
    }

    static clear(objectStoreNames) {
        let objectStores = objectStoreNames || IndexedDB.cacheObjectStores;
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

    static contains(objectStoreName, key) {
        return IndexedDB.db.transaction(objectStoreName).store.openKeyCursor(key).then(cursor => Boolean(cursor));
    }

    static resultExpiryCheck(result, ttl, objectStoreName) {
        if (!result) return null;
        if (!ttl) return result;
        if (IndexedDB.timestampedObjectStores.includes(objectStoreName)) return result;

        if (IndexedDB.isExpired(result.timestamp, ttl)) return null;

        return result.value;
    }

    static isExpired(timestamp, ttl) {
        return timestamp + ttl <= window.timestamp();
    }

    static async isObjectStoreExpired(objectStoreName, ttl) {
        if (!IndexedDB.timestampedObjectStores.includes(objectStoreName)) { return false; }
        if (!ttl) { return false; }
        
        let timestamp = await IndexedDB.db.get(objectStoreName, "timestamp");
        let expired;
        if (!timestamp) {
            expired = true;
        } else {
            expired = IndexedDB.isExpired(timestamp, ttl);
            if (expired) {
                await IndexedDB.clear(objectStoreName);
            }
        }
        return expired;
    }    
}
IndexedDB._promise = null;

/*  Entries of object stores in this array won't get checked
    for timestamps if cached.
    Instead of checking the single entry, the object store itself has
    a entry named "timestamp", containing a timestamp.

    This allows us to reduce the overhead of having one timestamp for
    each individual entry, although they're basically fetched during
    the same time.
*/
IndexedDB.timestampedObjectStores = [
    "coupons",
    "gifts",
    "passes",
    "items",
    "earlyAccessAppids",
    "purchases",
    "dynamicStore",
    "itad",
];
IndexedDB.cacheObjectStores = IndexedDB.timestampedObjectStores.concat([
    "packages",
    "storePageData",
    "profiles",
    "rates",
]);

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
    static getEndpoint(endpoint, query) {
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        return this._fetchWithDefaults(endpoint, query, { 'method': 'GET', }).then(response => response.json());
    }    
    static getPage(endpoint, query) {
        return this._fetchWithDefaults(endpoint, query, { 'method': 'GET', }).then(response => response.text());
    }
    static postEndpoint(endpoint, query) {
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        return this._fetchWithDefaults(endpoint, query, { 'method': 'POST', }).then(response => response.json());
    }
    static endpointFactory(endpoint) {
        return async params => this.getEndpoint(endpoint, params).then(result => result.data);
    }
    static endpointFactoryCached(endpoint, ttl, objectStoreName, key, multiple, oneDimensional, resultFn) {
        return async params => {
            let timestampedObjectStore = IndexedDB.timestampedObjectStores.includes(objectStoreName);

            // Only return a value for a specified key (other results will get cached in the DB)
            let returnValue = key instanceof KeyMapper || key;
            let dbKey = key instanceof KeyMapper ? key.map(params, false) : key;

            // The Steam IDs are greater than 2^53, so they can't be safely converted to a Number
            if (objectStoreName !== "profiles") {
                let intKey = Number(dbKey);
                if (intKey) {
                    dbKey = intKey;
                }
            }
            
            let requestKey = key instanceof KeyMapper ? key.map(params, true) : key;
            if (this._progressingRequests.has(requestKey)) {
                return this._progressingRequests.get(requestKey);
            }
            let val;
            if (timestampedObjectStore) {
                val = await IndexedDB.getAll(objectStoreName, ttl);
            } else {
                val = await IndexedDB.get(objectStoreName, dbKey, ttl);
            }
            if (val) {
                if (returnValue) return val;
                return;
            }
            let req = this.getEndpoint(endpoint, params)
                .then(result => {
                    if (resultFn) return resultFn(result.data);
                    return result.data;
                })
                .then(async finalResult => {
                    await IndexedDB.putCached(
                        objectStoreName,
                        oneDimensional ? undefined : finalResult,
                        oneDimensional ? finalResult : dbKey,
                        multiple
                    );
                    if (returnValue) return finalResult;
                    return;
                })
                .finally(() => this._progressingRequests.delete(requestKey));
            this._progressingRequests.set(requestKey, req);
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
                    browser.identity.launchWebAuthFlow({ url: `${Config.ITAD_ApiServerHost}/oauth/authorize/?client_id=${ITAD_Api.clientId}&response_type=token&state=${hash}&scope=wait_read%20coll_read&redirect_uri=https://${browser.runtime.id}.chromiumapp.org/itad`, interactive: true })
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

    static isExpired() {
        let lsEntry = LocalStorage.get("access_token");
        if (!lsEntry) return true;

        if (lsEntry.expiry <= window.timestamp()) {
            LocalStorage.remove("access_token");
            return true;
        }
        ITAD_Api.accessToken = lsEntry.token;
        ITAD_Api.fetchWaitlistAndCollection()
        return false;
    }

    static endpointFactoryCached(endpoint, ttl, objectStore, keyMapper, oneDimensional, resultFn) {
        return async params => {
            super.endpointFactoryCached(endpoint, ttl, objectStore, keyMapper, oneDimensional, resultFn)(Object.assign(params || {}, { access_token: ITAD_Api.accessToken }))
        }
    }

    static fetchWaitlistAndCollection() {
        return Promise.all([
            ITAD_Api.endpointFactoryCached("v01/user/wait/all/", 60 * 60, "itad", "waitlist")(),
            ITAD_Api.endpointFactoryCached("v01/user/coll/all/", 60 * 60, "itad", "collection")(),
        ]);
    }
}
ITAD_Api.accessToken = null;
ITAD_Api.clientId = "5fe78af07889f43a";

ITAD_Api.origin = Config.ITAD_ApiServerHost;
ITAD_Api._progressingRequests = new Map();

class SteamStore extends Api {
    // static origin = "https://store.steampowered.com/";
    // static params = { 'credentials': 'include', };
    // static _progressingRequests = new Map();

    static async addCouponAppids(coupons) {
        let package_queue = [];
        let packagesKeys = Object.keys(coupons).map(value => parseInt(value, 10));
        let packagesArr = await IndexedDB.get("packages", packagesKeys, 7 * 24 * 60 * 60);
        let packages = {};
        
        for (let i = 0; i < packagesArr.length; ++i) {
            packages[packagesKeys[i]] = packagesArr[i];
        }

        for (let [subid, coupon] of Object.entries(coupons)) {
            let details = packages[subid];
            if (!details) {
                package_queue.push(subid);
                continue;
            }
            coupon.appids = details;
        }

        function addKnownPackage(data) {
            let promises = [];
            for (let [subid, details] of Object.entries(data)) {
                if (!details || !details.success) {
                    if (coupons[subid]) {
                        coupons[subid].appids = [];
                        continue;
                    }                    
                }

                let appids = details.data.apps.map(obj => obj.id);

                if (coupons[subid])
                    coupons[subid].appids = appids;
                // .apps is an array of { 'id': ##, 'name': "", }
                promises.push(IndexedDB.putCached("packages", appids, parseInt(subid, 10)));
            }
            return Promise.all(promises);
        }

        let requests = [];
        for (let subid of package_queue) {
            requests.push(
                SteamStore.getEndpoint("/api/packagedetails/", { 'packageids': subid, })
                .then(addKnownPackage)
                .catch(err => console.error(err))
            );
            // this used to be a CSV input, now needs 1 GET / package.
            // rate limited to 200 requests / 5 min
            // if a specific request fails, log it and move on
        }

        await Promise.all(requests);
        return IndexedDB.putCached("coupons", Object.values(coupons), Object.keys(coupons).map(packageid => parseInt(packageid, 10)), true);
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

    static async _fetchPurchases(lang) {
        let self = SteamStore;
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
        let purchases = {};

        let html = await self.getPage("/account/licenses/", { 'l': lang, });
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
            purchases[appName] = node.textContent;
        }

        IndexedDB.putCached("purchases", purchases, lang);
        return purchases;
    }
    static async purchaseDate(appName, lang) {
        let key = `purchases_${lang}`;
        appName = HTMLParser.clearSpecialSymbols(appName);
        let purchases = await IndexedDB.get("purchases", lang, 24 * 60 * 60);
        if (purchases) return purchases[appName];

        // If a request is in flight, piggyback our response on that result
        if (SteamStore._progressingRequests.has(key)) {
            return SteamStore._progressingRequests.get(key).then(purchases => purchases[appName]);
        }

        // fetch updated Purchase Data
        let promise = SteamStore._fetchPurchases(lang)
            .then(purchases => {
                SteamStore._progressingRequests.delete(key);
                return purchases;
            });
        SteamStore._progressingRequests.set(key, promise);
        return promise.then(purchases => purchases[appName]);
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
        let self = SteamCommunity;

        let coupons;
        if (await IndexedDB.isObjectStoreExpired("coupons", 60 * 60)) {
            coupons = {};
            let data = await self.getInventory(3);

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
        } else {
            coupons = await IndexedDB.getAll("coupons", null, true);
        }
        return SteamStore.addCouponAppids(coupons);
    }
    static async giftsAndPasses() { // context#1, gifts and guest passes
        let self = SteamCommunity;

        let gifts, passes;
        let [giftsExpired, passesExpired] = await Promise.all([
            IndexedDB.isObjectStoreExpired("gifts", 60 * 60),
            IndexedDB.isObjectStoreExpired("passes", 60 * 60),
        ]);

        if (giftsExpired || passesExpired) {
            gifts = [];
            passes = [];

            let data = await self.getInventory(1);

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

            let promises = [];

            if (gifts.length)   promises.push(IndexedDB.putCached("gifts", undefined, gifts, true));
            if (passes.length)  promises.push(IndexedDB.putCached("passes", undefined, passes, true));
            return Promise.all(promises);
        }
    }

    static async items() { // context#6, community items
        let self = SteamCommunity;

        if (IndexedDB.isObjectStoreExpired("items", 60 * 60)) {
            // only used for market highlighting
            return IndexedDB.putCached("items", undefined, (await self.getInventory(6)).descriptions.map(item => item.market_hash_name), true);
        }
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
    
    static dynamicStore() {
        // FIXME, reduce dependence on whole object
        let self = Steam;
        // Is a request in progress?
        if (self._dynamicstore_promise) { return self._dynamicstore_promise; }
        
        if (IndexedDB.isObjectStoreExpired("dynamicStore", 15 * 60)) {
            // Cache miss, need to fetch
            self._dynamicstore_promise = SteamStore.getEndpoint("/dynamicstore/userdata/")
            .then(dynamicStore => {
                if (!dynamicStore.rgOwnedApps) {
                    throw new Error("Could not fetch DynamicStore UserData");
                }
                return Promise.all([
                    IndexedDB.putCached("dynamicStore", Object.keys(dynamicStore.rgIgnoredApps).map(value => parseInt(value, 10)), "ignored"),
                    IndexedDB.putCached("dynamicStore", dynamicStore.rgOwnedApps, "owned"),
                    IndexedDB.putCached("dynamicStore", dynamicStore.rgWishlist, "wishlisted"),
                ]);
            }).then(() => self._dynamicstore_promise = null);

            return self._dynamicstore_promise;
        }
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

class KeyMapper {
    constructor(keyPath, prefix) {
        this.keyPath = keyPath;
        this.prefix = prefix;
    }

    map(params, withPrefix) {
        let key = '';
        if (withPrefix) key = this.prefix;
        return key += params[this.keyPath];
    }
}

let storePageDataMapper = new KeyMapper("appid", "app_");
let ratesMapper = new KeyMapper("to", "rates_");
let profilesMapper = new KeyMapper("profile", "profile_");

let actionCallbacks = new Map([
    ['wishlist.add', SteamStore.wishlistAdd],
    ['dynamicstore', Steam.dynamicStore],
    ['dynamicstore.clear', Steam.clearDynamicStore],
    ['steam.currencies', Steam.currencies],
    
    ['cache.clear', IndexedDB.clear],
    ['earlyAccessAppids', AugmentedSteamApi.endpointFactoryCached("v01/earlyaccess", 60*60, "earlyAccessAppids", null, true, true, result => Object.keys(result).map(x => parseInt(x, 10)))],
    ['dlcinfo', AugmentedSteamApi.endpointFactory("v01/dlcinfo")],
    ['storepagedata', AugmentedSteamApi.endpointFactoryCached('v01/storepagedata', 60*60, "storePageData", storePageDataMapper)],
    ['storepagedata.expire', AugmentedSteamApi.expireStorePageData],
    ['prices', AugmentedSteamApi.endpointFactory('v01/prices')],
    ['rates', AugmentedSteamApi.endpointFactoryCached('v01/rates', 60*60, "rates", ratesMapper)],
    ['profile', AugmentedSteamApi.endpointFactoryCached('v01/profile/profile', 24*60*60, "profiles", profilesMapper)],
    ['profile.clear', AugmentedSteamApi.clearEndpointCache(profilesMapper, "profiles")],
    ['profile.background', AugmentedSteamApi.endpointFactory('v01/profile/background/background')],
    ['profile.background.games', AugmentedSteamApi.endpointFactory('v01/profile/background/games')],
    ['twitch.stream', AugmentedSteamApi.endpointFactory('v01/twitch/stream')],
    ['market.cardprices', AugmentedSteamApi.endpointFactory('v01/market/cardprices')],
    ['market.averagecardprice', AugmentedSteamApi.endpointFactory('v01/market/averagecardprice')], // FIXME deprecated
    ['market.averagecardprices', AugmentedSteamApi.endpointFactory('v01/market/averagecardprices')],

    ['appdetails', SteamStore.endpointFactory("api/appdetails/")],
    ['appuserdetails', SteamStore.endpointFactory("api/appuserdetails/")],
    ['currency', SteamStore.currency],
    ['sessionid', SteamStore.sessionId],
    ['purchasedate', SteamStore.purchaseDate],

    ['login', SteamCommunity.login],
    ['logout', SteamCommunity.logout],
    ['cards', SteamCommunity.cards],
    ['stats', SteamCommunity.stats],
    ['inventory.coupons', SteamCommunity.coupons], // #3
    ['inventory.gifts', SteamCommunity.giftsAndPasses], // #1
    ['inventory.community', SteamCommunity.items], // #6

    ['itad.authorize', ITAD_Api.authorize],
    ['itad.checkexpiry', ITAD_Api.isExpired],

    ['idb.get', IndexedDB.get],
    ['idb.getfromindex', IndexedDB.getFromIndex],
    ['idb.getallfromindex', IndexedDB.getAllFromIndex],
    ['idb.put', IndexedDB.put],
    ['idb.delete', IndexedDB.delete],
    ['idb.contains', IndexedDB.contains],

    ['error.test', () => { return Promise.reject(new Error("This is a TEST Error. Please ignore.")); }],
]);
// new Map() for Map.prototype.get() in lieu of:
// Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)

IndexedDB
    .catch(err => console.error("Failed to open database!", err))
    .then(() => browser.runtime.onMessage.addListener(async (message, sender) => {
        if (!sender || !sender.tab) { return; } // not from a tab, ignore
        if (!message || !message.action) { return; }
      
        let callback = actionCallbacks.get(message.action);
        if (!callback) {
            // requested action not recognized, reply with error immediately
            throw new Error(`Did not recognize '${message.action}' as an action.`);
        }
    
        message.params = message.params || [];
        try {
            return await callback(...message.params);
        } catch(err) {
            console.error(`Failed to execute callback ${message.action}: ${err.name}: ${err.message}`);
            throw err;
        }
    }));
