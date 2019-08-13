class CacheStorage {
    static timestamp() { return Math.trunc(Date.now() / 1000); }
    static isExpired (timestamp, ttl) {
        if (!timestamp) return true;
        if (typeof ttl != 'number' || ttl < 0) ttl = 0;
        return timestamp + ttl <= CacheStorage.timestamp();
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
        localStorage.setItem('cache_' + key, JSON.stringify({ 'data': value, 'timestamp': CacheStorage.timestamp(), }));
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
            IndexedDB._promise = new Promise((resolve, reject) => {
                let request = indexedDB.open("Augmented Steam", Info.db_version);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    IndexedDB.db = request.result;
                    IndexedDB.db.onerror = event => console.error("Database error:", event.target.errorCode);
                    resolve();
                }
                request.onupgradeneeded = event => {
                    let db = request.result;
                    let oldVersion = event.oldVersion;
                    if (oldVersion < 1) {
                        db.createObjectStore("coupons").createIndex("appid", "appids", { multiEntry: true });
                        db.createObjectStore("gifts");
                        db.createObjectStore("passes");
                        db.createObjectStore("items");
                        db.createObjectStore("earlyAccessAppids");
                        db.createObjectStore("purchases");
                        db.createObjectStore("dynamicStore");
                        db.createObjectStore("packages");
                        db.createObjectStore("storePageData");
                        db.createObjectStore("profiles");
                        db.createObjectStore("rates");
                        db.createObjectStore("notes");
                    }
                }
            });
        }
        return IndexedDB._promise;
    }
    static catch(onCatch) {
        return IndexedDB.init().catch(onCatch);
    }

    static putCached(objectStoreName, data, key, multiple) {
        return IndexedDB.put(objectStoreName, data, key, multiple, true);
    }

    static put(objectStoreName, data, key, multiple, cached) {
        return new Promise((resolve, reject) => {

            let transaction = IndexedDB.db.transaction(objectStoreName, "readwrite");
            transaction.oncomplete = () => resolve();
            transaction.onerror = event => reject(event.target.error);

            let objectStore = transaction.objectStore(objectStoreName);
            if (cached) {
                let timestamp = IndexedDB.timestamp();
                if (IndexedDB.timestampedObjectStores.includes(objectStoreName)) {
                    objectStore.put(timestamp, "timestamp");
                } else if (multiple) {
                    data.map(value => ({ "value": value, "timestamp": timestamp }));
                }
            }
            if (multiple) {
                if (key) {
                    for (let i = 0; i < key.length; ++i) {
                        objectStore.put(data[i], key[i]);
                    }
                } else {
                    data.forEach(value => objectStore.put(value));
                }
            } else {
                if (key) {
                    objectStore.put(data, key);
                } else {
                    objectStore.put(data);
                }
            }
        });
    }

    static get(objectStoreName, key, ttl, withKey) {
        return new Promise(async (resolve, reject) => {
            let multiple = Array.isArray(key);
            let results;

            if (withKey) {
                results = {};
            } else if (multiple) {
                results = [];
            }

            let transaction = IndexedDB.db.transaction(objectStoreName);
            transaction.oncomplete = () => resolve(results);
            transaction.onerror = event => reject(event.target.error);

            let objectStore = transaction.objectStore(objectStoreName);

            if (await IndexedDB.isObjectStoreExpired(objectStore, ttl)) {
                results = null;
                return;
            }
            if (multiple) {
                for (let i = 0; i < key.length; ++i) {
                    objectStore.get(key[i]).onsuccess = event => {
                        if (withKey) {
                            results[key[i]] = IndexedDB.resultExpiryCheck(event.target.result, ttl, objectStoreName);
                        } else {
                            results[i] = IndexedDB.resultExpiryCheck(event.target.result, ttl, objectStoreName);
                        }
                    };
                }
            } else {
                objectStore.get(key).onsuccess = event => {
                    if (withKey) {
                        results[key] = IndexedDB.resultExpiryCheck(event.target.result, ttl, objectStoreName);
                    } else {
                        results = IndexedDB.resultExpiryCheck(event.target.result, ttl, objectStoreName);
                    }
                };
            }
        });
    }

    static getAll(objectStoreName, ttl, withKey = false) {
        return new Promise(async (resolve, reject) => {
            let results = withKey ? {} : [];

            let transaction = IndexedDB.db.transaction(objectStoreName);
            transaction.oncomplete = () => resolve(results);
            transaction.onerror = event => reject(event.target.error);

            let objectStore = transaction.objectStore(objectStoreName);

            if (await IndexedDB.isObjectStoreExpired(objectStore, ttl)) {
                results = null;
                return;
            }
            objectStore.openCursor().onsuccess = event => {
                let cursor = event.target.result;
                if (cursor && cursor.key !== "timestamp") {
                    if (withKey) {
                        results[cursor.key] = IndexedDB.resultExpiryCheck(cursor.value, ttl, objectStoreName);
                    } else {
                        results.push(IndexedDB.resultExpiryCheck(cursor.value, ttl, objectStoreName));
                    }
                    cursor.continue();
                }
            }
        });
    }

    static delete(objectStoreName, key) {
        return new Promise((resolve, reject) => {
            let multiple = Array.isArray(key);

            let transaction = IndexedDB.db.transaction(objectStoreName, "readwrite");
            transaction.oncomplete = () => resolve();
            transaction.onerror = event => reject(event.target.error);

            let objectStore = transaction.objectStore(objectStoreName);
            if (multiple) {
                key.forEach(key => objectStore.delete(key));
            } else {
                objectStore.delete(key);
            }
        });
    }

    static clear(objectStoreNames) {
        return new Promise((resolve, reject) => {
            let objectStores = objectStoreNames || IndexedDB.cacheObjectStores;
            let multiple = Array.isArray(objectStores);

            let transaction = IndexedDB.db.transaction(objectStores, "readwrite");
            transaction.oncomplete = () => resolve();
            transaction.onerror = event => reject(event.target.error);

            if (multiple) {
                objectStores.forEach(objectStoreName => {
                    transaction.objectStore(objectStoreName).clear();
                });
            } else {
                transaction.objectStore(objectStoreNames).clear();
            }
        });
    }

    static containsKey(objectStoreName, key)      { return IndexedDB.contains(objectStoreName, key, IndexedDB.key) }
    static containsValue(objectStoreName, value)  { return IndexedDB.contains(objectStoreName, value, IndexedDB.value) }

    static contains(objectStoreName, toBeChecked, type) {
        return new Promise((resolve, reject) => {
            let multiple = Array.isArray(toBeChecked);
            let contained;
            if (multiple) contained = [];

            let transaction = IndexedDB.db.transaction(objectStoreName);
            transaction.oncomplete = () => resolve(contained);
            transaction.onerror = event => reject(event.target.error);

            let objectStore = transaction.objectStore(objectStoreName);
            if (multiple) {
                toBeChecked.forEach((key, i) => {
                    objectStore.openKeyCursor(key).onsuccess = event => {
                        let cursor = event.target.result;
                        if (cursor) {
                            contained[i] = true;
                        } else {
                            contained[i] = false;
                        }
                    }
                })
            } else {
                objectStore.openKeyCursor(toBeChecked).onsuccess = event => {
                    let cursor = event.target.result;
                    if (cursor) {
                        contained = true;
                    } else {
                        contained = false;
                    }
                }
            }           
        });
    }

    static resultExpiryCheck(result, ttl, objectStoreName) {
        if (!result) return null;
        if (!ttl) return result;
        if (IndexedDB.timestampedObjectStores.includes(objectStoreName)) return result;

        if (IndexedDB.isExpired(result.timestamp, ttl)) return null;

        return result.value;
    }

    static isExpired(timestamp, ttl) {
        return timestamp + ttl <= IndexedDB.timestamp();
    }

    static isObjectStoreExpired(objectStore, ttl) {
        return new Promise((resolve, reject) => {
            let isObject = objectStore instanceof IDBObjectStore;

            let objectStoreName = isObject ? objectStore.name : objectStore;
            if (!IndexedDB.timestampedObjectStores.includes(objectStoreName)) {
                resolve(false);
                return;
            }

            if (!ttl) {
                resolve(false);
                return;
            }
            
            if (!isObject) {
                let transaction = IndexedDB.db.transaction(objectStoreName);
                transaction.onerror = event => reject(event.target.error);

                objectStore = transaction.objectStore(objectStoreName);
            }

            let request = objectStore.get("timestamp");
            if (isObject) {
                request.onerror = event => reject(event.target.error);
            }

            request.onsuccess = async event => {
                let result = event.target.result;
                let expired;
                if (!result) {
                    expired = true;
                } else {
                    expired = IndexedDB.isExpired(result, ttl);
                }

                if (expired) {
                    await IndexedDB.clear(objectStore.name);
                }

                resolve(expired);
            };
            
            
        });
    }

    static timestamp() { return Math.trunc(Date.now() / 1000); }
    
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
];
IndexedDB.cacheObjectStores = IndexedDB.timestampedObjectStores.concat([
    "packages",
    "storePageData",
    "profiles",
    "rates",
]);

IndexedDB.key = Symbol("key");
IndexedDB.value = Symbol("value");

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
    static endpointFactoryCached(endpoint, ttl, objectStore, keyMapper) {
        return async params => {
            let key = keyMapper.map(params, false);
            if (!key) {
                throw new Error(`Can't cache '${endpoint}' with invalid key`);
            }
            let requestKey = keyMapper.map(params, true);
            if (this._progressingRequests.has(requestKey)) {
                return this._progressingRequests.get(requestKey);
            }
            let val = await IndexedDB.get(objectStore, key, ttl);
            if (val) return val;
            let req = this.getEndpoint(endpoint, params)
                .then(result => {
                    IndexedDB.putCached(objectStore, result.data, key);
                    return result;
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
    // static _earlyAccessAppIds_promise = null;
    
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

    static _earlyAccessAppIds() {
        let self = AugmentedSteamApi;
        // Is a request in progress?
        if (self._earlyAccessAppIds_promise) { return self._earlyAccessAppIds_promise; }
        
        // Get data from localStorage
        let appids = CacheStorage.get('early_access_appids', 60 * 60); // appids expires after an hour
        if (appids) { return appids; }

        // Cache expired, need to fetch
        self._earlyAccessAppIds_promise = self.getEndpoint("v01/earlyaccess")
            //.then(response => response.json().then(data => ({ 'result': data.result, 'data': data.data, 'timestamp': CacheStorage.timestamp(), })))
            .then(function(appids) {
                appids = Object.keys(appids.data).map(x => parseInt(x, 10)); // convert { "570": 570, } to [570,]
                CacheStorage.set("early_access_appids", appids);
                self._earlyAccessAppIds_promise = null; // no request in progress
                return appids;
            })
            ;
        return self._earlyAccessAppIds_promise;
    }

    static earlyAccessAppIds() {
        return AugmentedSteamApi._earlyAccessAppIds();    
    }

    static expireStorePageData(appid) {
        CacheStorage.remove(`app_${appid}`);
    }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();
AugmentedSteamApi._earlyAccessAppIds_promise = null;

class ITAD_Api extends Api{
    static authorize(hash) {
        return new Promise(resolve => {
            browser.permissions.request({ permissions: ["identity"] }).then(granted => {
                if (granted) {
                    browser.identity.launchWebAuthFlow(
                        { url: `${Config.ITAD_ApiServerHost}/oauth/authorize/?client_id=${ITAD_Api.clientId}&response_type=token&state=${hash}&scope=wait_read%20coll_read&redirect_uri=https://${browser.runtime.id}.chromiumapp.org/itad`, interactive: true }).then(url => {
                            if (url) {
                                let hashFragment = new URL(url).hash;
                                if (hashFragment) {
                                    let params = new URLSearchParams(hashFragment.substr(1));
        
                                    if (parseInt(params.get("state"), 10) === hash) {
                                        let accessToken = params.get("access_token");
                                        let expiresIn = params.get("expires_in");
            
                                        if (accessToken && expiresIn) {
                                            localStorage.setItem("access_token", JSON.stringify({ token: accessToken, expiry: CacheStorage.timestamp() + parseInt(expiresIn, 10) }));
                                            resolve();
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
        let lsEntry = localStorage.getItem("access_token");
        if (!lsEntry) return true;

        let item;
        try {
            item = JSON.parse(lsEntry);
        } catch(err) {
            return true;
        }

        if (item.expiry <= CacheStorage.timestamp()) {
            localStorage.removeItem("access_token");
            return true;
        }
        return false;
    }
}
ITAD_Api.origin = Config.ITAD_ApiServerHost;
ITAD_Api.clientId = "5fe78af07889f43a";

class SteamStore extends Api {
    // static origin = "https://store.steampowered.com/";
    // static params = { 'credentials': 'include', };
    // static _progressingRequests = new Map();

    static async addCouponAppids(coupons) {
        let package_queue = [];
        let packages = await IndexedDB.get("packages", Object.keys(coupons), 7 * 24 * 60 * 60, true);
        
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

            if (gifts.length)   promises.push(IndexedDB.putCached("gifts", gifts, gifts, true));
            if (passes.length)  promises.push(IndexedDB.putCached("passes", passes, passes, true));
            return Promise.all(promises);
        }
    }

    static async items() { // context#6, community items
        let self = SteamCommunity;

        // only used for market highlighting, need to be able to return a Set() of ['market_hash_name']
        /*let inventory = await IndexedDB.get("inventories", 6, 3600);
        if (!inventory) {
            inventory = (await self.getInventory(6)).descriptions.map(item => item.market_hash_name);
            IndexedDB.putCached("inventories", inventory, 6);
        }
        return inventory;*/
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
    
    /**
     * Requires user to be signed in, can we validate this from background?
     */
    static async _dynamicstore() {
        let self = Steam;
        // Is a request in progress?
        if (self._dynamicstore_promise) { return self._dynamicstore_promise; }
        
        // Get data from localStorage
        let dynamicstore = CacheStorage.get('dynamicstore', 15 * 60); // dynamicstore userdata expires after 15 minutes
        if (dynamicstore) { return dynamicstore; }

        // Cache miss, need to fetch
        self._dynamicstore_promise = SteamStore.getEndpoint('/dynamicstore/userdata/')
            .then(function(dynamicstore) {
                if (!dynamicstore.rgOwnedApps) {
                    throw new Error("Could not fetch DynamicStore UserData");
                }
                CacheStorage.set("dynamicstore", dynamicstore);
                self._dynamicstore_promise = null; // no request in progress
                return dynamicstore;
            })
            ;
        return self._dynamicstore_promise;
    }       
    // dynamicstore keys are:
    // "rgWishlist", "rgOwnedPackages", "rgOwnedApps", "rgPackagesInCart", "rgAppsInCart"
    // "rgRecommendedTags", "rgIgnoredApps", "rgIgnoredPackages", "rgCurators", "rgCurations"
    // "rgCreatorsFollowed", "rgCreatorsIgnored", "preferences", "rgExcludedTags",
    // "rgExcludedContentDescriptorIDs", "rgAutoGrantApps"

    static ignored() {
        return Steam._dynamicstore().then(userdata => Object.keys(userdata.rgIgnoredApps));
    }
    static owned() {
        return Steam._dynamicstore().then(userdata => userdata.rgOwnedApps);       
    }
    static wishlist() {
        return Steam._dynamicstore().then(userdata => userdata.rgWishlist);        
    }
    static dynamicStore() {
        // FIXME, reduce dependence on whole object
        return Steam._dynamicstore();
    }
    static clearDynamicStore() {
        CacheStorage.remove('dynamicstore');
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
    ['ignored', Steam.ignored],
    ['owned', Steam.owned],
    ['wishlist', Steam.wishlist],
    ['wishlist.add', SteamStore.wishlistAdd],
    ['dynamicstore', Steam.dynamicStore],
    ['dynamicstore.clear', Steam.clearDynamicStore],
    ['steam.currencies', Steam.currencies],
    
    ['cache.clear', IndexedDB.clear],
    ['early_access_appids', AugmentedSteamApi.earlyAccessAppIds],
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
