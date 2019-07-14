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
            })
        ;
    }

    static endpointFactory(endpoint) {
        return async ({ 'params': params }) => AugmentedSteamApi.getEndpoint(endpoint, params).then(result => result.data);
    }

    static endpointFactoryCached(endpoint, ttl, keyfn) {
        let self = AugmentedSteamApi;
        return async function({ 'params': params }) {
            let key = keyfn;
            if (typeof keyfn == 'function') {
                key = keyfn(params);
            }
            if (typeof key == 'undefined') {
                throw new Error(`Can't cache '${endpoint}' with undefined key`);
            }
            if (self._progressingRequests.has(key)) {
                return self._progressingRequests.get(key);
            }
            let val = CacheStorage.get(key, ttl);
            if (typeof val !== 'undefined') {
                return val;
            }
            let req = self.getEndpoint(endpoint, params)
                .then(function(result) {
                    CacheStorage.set(key, result.data);
                    self._progressingRequests.delete(key);
                    return result.data;
                });
                self._progressingRequests.set(key, req);
            return req;
        };
    }

    static clearEndpointCache(keyfn) {
        let self = AugmentedSteamApi;
        return async function({ 'params': params }) {
            let key = keyfn;
            if (typeof keyfn == 'function') {
                key = keyfn(params);
            }
            if (typeof key == 'undefined') {
                throw new Error(`Can't clear undefined key from cache`);
            }
            self._progressingRequests.delete(key);
            CacheStorage.remove(key);
        };
    }

    static clear() {
        CacheStorage.clear();
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

    static async earlyAccessAppIds() {
        return AugmentedSteamApi._earlyAccessAppIds();    
    }

    static async dlcInfo({ 'params': params, }) {
        return AugmentedSteamApi.getEndpoint("v01/dlcinfo", params).then(result => result.data);
    }

    static async expireStorePageData({ 'params': params, }) {
        CacheStorage.remove(`app_${params.appid}`);
    }
}
AugmentedSteamApi.origin = Config.ApiServerHost;
AugmentedSteamApi._progressingRequests = new Map();
AugmentedSteamApi._earlyAccessAppIds_promise = null;


class SteamStore extends Api {
    // static origin = "https://store.steampowered.com/";
    // static params = { 'credentials': 'include', };
    // static _progressingRequests = new Map();
    
    static async appDetails({ 'params': params, }) {
        return SteamStore.getEndpoint("/api/appdetails/", params);
    }

    static async appUserDetails({ 'params': params, }) {
        return SteamStore.getEndpoint("/api/appuserdetails/", params);
    }

    static async packageDetails({ 'params': params, }) {
        return SteamStore.getEndpoint("/api/packagedetails/", params);
    }

    static async addCouponAppIds(coupons) {
        let self = SteamStore;
        // FIXME, Temporarily use LocalStorage for caching. This is ideal for IndexedDB
        let packages = LocalStorage.get('known_packages', {});
        // Expire cache
        for (let [subid, details] of Object.entries(packages)) {
            if (details.timestamp + 7 * 24 * 60 * 60 < CacheStorage.timestamp()) {
                delete packages[subid];
            }
        }

        let package_queue = [];
        for (let [subid, coupon] of Object.entries(coupons)) {
            let details = packages[subid];
            if (!details) {
                package_queue.push(subid);
                continue;
            }
            coupon.appids = details.appids;
        }

        function addKnownPackage(data) {
            for (let [subid, details] of Object.entries(data)) {
                if (!details || !details.success) {
                    if (coupons[subid]) {
                        coupons[subid].appids = [];
                        continue;
                    }
                }
                details = details.data;
                packages[subid] = { 'appids': details.apps, 'timestamp': CacheStorage.timestamp(), };
                // .apps is an array of { 'id': ##, 'name': "", }, TODO check if we need to clearSpecialSymbols(name)
                if (coupons[subid])
                    coupons[subid].appids = packages[subid].appids;
            }
        }

        let requests = [];
        for (let subid of package_queue) {
            requests.push(
                self.getEndpoint("/api/packagedetails/", { 'packageids': subid, })
                .then(addKnownPackage)
                .catch(err => console.error(err))
            );
            // this used to be a CSV input, now needs 1 GET / package.
            // rate limited to 200 requests / 5 min
            // if a specific request fails, log it and move on
        }

        await Promise.all(requests);

        LocalStorage.set('known_packages', packages);
        return coupons;
    }
    
    static async wishlistAdd({ 'params': params, }) {
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

        CacheStorage.set(`purchases_${lang}`, purchases);
        return purchases;
    }
    static async purchase({ 'params': params, }) {
        let self = SteamStore;
        if (!params || !params.appName) {
            throw new Error('Purchases endpoint expects an appName');
        }
        if (!params || !params.lang) {
            throw new Error('Purchases endpoint requires language to be specified');
        }
        let lang = params.lang;
        let key = `purchases_${lang}`;

        let appName = HTMLParser.clearSpecialSymbols(params.appName);
        let purchases = CacheStorage.get(key, 5 * 60);
        if (purchases) return purchases[appName];

        // Purchase Data is more than 5 minutes old
        purchases = LocalStorage.get(`cache_${key}`);
        if (purchases && purchases.data[appName]) return purchases.data[appName];
        // ... and doesn't include the title

        // If a request is in flight, piggyback our response on that result
        if (self._progressingRequests.has(key)) {
            return self._progressingRequests.get(key).then(purchases => purchases[appName]);
        }

        // fetch updated Purchase Data
        let promise = self._fetchPurchases(lang)
            .then(function(purchases) {
                self._progressingRequests.delete(key);
                return purchases;
            });
        self._progressingRequests.set(key, promise);
        return promise.then(purchases => purchases[appName]);
    }
}
SteamStore.origin = "https://store.steampowered.com/";
SteamStore.params = { 'credentials': 'include', };
SteamStore._progressingRequests = new Map();


class SteamCommunity extends Api {
    // static origin = "https://steamcommunity.com/";
    // static params = { 'credentials': 'include', };

    static cards({ 'params': params, }) {
        return SteamCommunity.getPage(`/my/gamecards/${params.appid}`, (params.border ? { 'border': 1, } : undefined)).catch(() => {
            throw new Error("Could not retrieve cards for appid " + params.appid);
        });
    }

    static stats({ 'params': params, }) {
        return SteamCommunity.getPage(`/my/stats/${params.appid}`).catch(() => {
            throw new Error("Could not retrieve stats for appid " + params.appid);
        });
    }

    /**
     * Inventory functions, must be signed in to function correctly
     */
    static async coupons() { // context#3
        let self = SteamCommunity;
        let login = LocalStorage.get("login");
        if (!login) throw new Error("Must be signed in to access Inventory");

        let coupons = CacheStorage.get("inventory_3", 3600);
        if (!coupons) {
            let data = await self.getEndpoint(`/inventory/${login.steamId}/753/3`, { "l": "english", "count": 5000 });
            if (!data || !data.success) throw new Error("Could not retrieve Inventory 753/3");
            coupons = {};

            for(let description of data.descriptions) {
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

            CacheStorage.set("inventory_3", coupons);
        }
        return await SteamStore.addCouponAppIds(coupons);
    }
    static async gifts() { // context#1, gifts and guest passes
        let self = SteamCommunity;
        let login = LocalStorage.get('login');
        if (!login) throw `Must be signed in to access Inventory`;

        let value = CacheStorage.get('inventory_1', 3600);
        if (!value) {
            let gifts = [], passes = [];

            let data = await self.getEndpoint(`${login.profilePath}inventory/json/753/1/`, { 'l': 'en', });
            if (!data || !data.success) throw new Error(`Could not retrieve Inventory 753/1`);

            for(let [key, obj] of Object.entries(data.rgDescriptions)) {
                let isPackage = false;
                if (obj.descriptions) {
                    for (let desc of obj.descriptions) {
                        if (desc.type === "html") {
                            let appids = GameId.getAppids(desc.value);
                            // Gift package with multiple apps
                            isPackage = true;
                            for (let appid of appids) {
                                if (!appid) { continue; }
                                if (obj.type === "Gift") {
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
                if (!isPackage && obj.actions) {
                    let appid = GameId.getAppid(obj.actions[0].link);
                    if (appid) {
                        if (obj.type === "Gift") {
                            gifts.push(appid);
                        } else {
                            passes.push(appid);
                        }
                    }
                }
            }

            value = { 'gifts': gifts, 'passes': passes, };
            CacheStorage.set('inventory_1', value);
        }
        return value;
    }

    static async items() { // context#6, community items
        let self = SteamCommunity;
        let login = LocalStorage.get('login');
        if (!login) throw `Must be signed in to access Inventory`;

        // only used for market highlighting, need to be able to return a Set() of ['market_hash_name']
        let inventory = CacheStorage.get('inventory_6', 3600);
        if (!inventory) {
            inventory = await self.getEndpoint(`${login.profilePath}inventory/json/753/6/`, { 'l': 'en', });
            if (!inventory || !inventory.success) throw new Error(`Could not retrieve Inventory 753/6`);

            CacheStorage.set('inventory_6', inventory);
        }
        return Object.values(inventory.rgDescriptions || {}).map(item => item['market_hash_name']);
    }

    /**
     * Invoked when the content script thinks the user is logged in
     * If we don't know the user's steamId, fetch their community profile
     */
    static async login({ 'params': params, }) {
        let self = SteamCommunity;
        if (!params || !params.path) {
            self.logout();
            throw new Error("Login endpoint needs profile url");
        }
        let url = new URL(params.path, "https://steamcommunity.com/");
        if (!params.path.startsWith('/id/') && !params.path.startsWith('/profiles/')) {
            self.logout();
            throw new Error(`Could not interpret '${params.path}' as a profile`);
        }
        let login = LocalStorage.get('login');
        if (login && login.profilePath === params.path) {
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

        let value = { 'steamId': steamId, 'profilePath': params.path, };
        LocalStorage.set('login', value);

        // As this is a new login, also retrieve country information from store account page
        value.userCountry = await (SteamStore.country().catch(err => undefined));
        return value;
    }

    static logout() {
        LocalStorage.remove('login');
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

    static async ignored() {
        return Steam._dynamicstore().then(userdata => Object.keys(userdata.rgIgnoredApps));
    }
    static async owned() {
        return Steam._dynamicstore().then(userdata => userdata.rgOwnedApps);       
    }
    static async wishlist() {
        return Steam._dynamicstore().then(userdata => userdata.rgWishlist);        
    }
    static async dynamicStore() {
        // FIXME, reduce dependence on whole object
        return Steam._dynamicstore();
    }
    static async clearDynamicStore() {
        CacheStorage.remove('dynamicstore');
        Steam._dynamicstore_promise = null;
    }

    static fetchCurrencies() {
        // https://partner.steamgames.com/doc/store/pricing/currencies
        return ExtensionResources.getJSON('json/currency.json');
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


let profileCacheKey = (params => `profile_${params.profile}`);
let appCacheKey = (params => `app_${params.appid}`);
let ratesCacheKey = (params => `rates_${params.to}`);

let actionCallbacks = new Map([
    ['ignored', Steam.ignored],
    ['owned', Steam.owned],
    ['wishlist', Steam.wishlist],
    ['wishlist.add', SteamStore.wishlistAdd],
    ['dynamicstore', Steam.dynamicStore],
    ['dynamicstore.clear', Steam.clearDynamicStore],
    ['steam.currencies', Steam.currencies],
    
    ['api.cache.clear', AugmentedSteamApi.clear],
    ['early_access_appids', AugmentedSteamApi.earlyAccessAppIds],
    ['dlcinfo', AugmentedSteamApi.dlcInfo],
    ['storepagedata', AugmentedSteamApi.endpointFactoryCached('v01/storepagedata', 60*60, appCacheKey)],
    ['storepagedata.expire', AugmentedSteamApi.expireStorePageData],
    ['prices', AugmentedSteamApi.endpointFactory('v01/prices')],
    ['rates', AugmentedSteamApi.endpointFactoryCached('v01/rates', 60*60, ratesCacheKey)],
    ['profile', AugmentedSteamApi.endpointFactoryCached('v01/profile/profile', 24*60*60, profileCacheKey)],
    ['profile.clear', AugmentedSteamApi.clearEndpointCache(profileCacheKey)],
    ['profile.background', AugmentedSteamApi.endpointFactory('v01/profile/background/background')],
    ['profile.background.games', AugmentedSteamApi.endpointFactory('v01/profile/background/games')],
    ['twitch.stream', AugmentedSteamApi.endpointFactory('v01/twitch/stream')],
    ['market.cardprices', AugmentedSteamApi.endpointFactory('v01/market/cardprices')],
    ['market.averagecardprice', AugmentedSteamApi.endpointFactory('v01/market/averagecardprice')], // FIXME deprecated
    ['market.averagecardprices', AugmentedSteamApi.endpointFactory('v01/market/averagecardprices')],

    ['appdetails', SteamStore.appDetails],
    ['appuserdetails', SteamStore.appUserDetails],
    ['currency', SteamStore.currency],
    ['sessionid', SteamStore.sessionId],
    ['purchase', SteamStore.purchase],

    ['login', SteamCommunity.login],
    ['logout', SteamCommunity.logout],
    ['cards', SteamCommunity.cards],
    ['stats', SteamCommunity.stats],
    ['inventory.coupons', SteamCommunity.coupons], // #3
    ['inventory.gifts', SteamCommunity.gifts], // #1
    ['inventory.community', SteamCommunity.items], // #6

    ['error.test', () => { return Promise.reject(new Error("This is a TEST Error. Please ignore.")); }],
]);
// new Map() for Map.prototype.get() in lieu of:
// Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!sender || !sender.tab) { return false; } // not from a tab, ignore
    if (!message || !message.action) { return false; }
  
    let callback = actionCallbacks.get(message.action);
    if (!callback) {
        // requested action not recognized, reply with error immediately
        sendResponse({ 'error': `Did not recognize '${message.action}' as an action.`, });
        return false;
    }

    Promise.resolve(callback(message))
        .then(response => sendResponse({ 'response': response, }))
        .catch(function(err) {
            console.error(err, message.action);
            let response = {
                'error': true,
                'message': "An unknown error occurred.",
                'action': message.action,
            };
            if (typeof err == 'string') {
                response.message = err;
            } else if (err instanceof Error) {
                // JSON.stringify(Error) == "{}"
                response.message = err.message;
                response.stack = err.stack;
            } else {
                response.message = err.toString();
                response.stack = (new Error()).stack;
            }
            sendResponse(response);
        });

    // keep channel open until callback resolves
    return true;
});
