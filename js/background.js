

const LocalStorage = (function(){
    let self = {};

    self.get = function(key, defaultValue) {
        let item = localStorage.getItem(key);
        if (!item) return defaultValue;
        try {
            return JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
    };

    self.set = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    self.remove = function(key) {
        localStorage.removeItem(key);
    };

    self.keys = function() {
        let result = [];
        for (let i = localStorage.length - 1; i >= 0; --i) {
            result.push(localStorage.key(i));
        }
        return result;
    };

    self.clear = function() {
        localStorage.clear();
    };

    Object.freeze(self);
    return self;
})();


const LocalStorageCache = (function(){
    let self = {};

    self.timestamp = () => Math.trunc(Date.now() / 1000);
    self.isExpired = function(timestamp, ttl) {
        if (!timestamp) return true;
        if (typeof ttl != 'number' || ttl < 0) ttl = 0;
        return timestamp + ttl <= this.timestamp();
    };

    self.get = function(key, ttl, defaultValue) {
        if (!ttl) return defaultValue;
        let item = localStorage.getItem('cache_' + key);
        if (!item) return defaultValue;
        try {
            item = JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
        if (!item.timestamp || self.isExpired(item.timestamp, ttl)) return defaultValue;
        return item.data;
    };

    self.set = function(key, value) {
        localStorage.setItem('cache_' + key, JSON.stringify({ 'data': value, 'timestamp': self.timestamp(), }));
    };

    self.remove = function(key) {
        localStorage.removeItem('cache_' + key);
    };

    self.keys = function() {
        return LocalStorage.keys()
            .filter(k => k.startsWith('cache_'))
            .map(k => k.substring(6)); // "cache_".length == 6
    };

    self.clear = function() {
        let keys = self.keys();
        for (let key of keys) {
            self.remove(key);
        }
    };

    Object.freeze(self);
    return self;    
})();


const AugmentedSteamApi = (function() {
    let self = {};

    let progressingRequests = new Map();
    self.getEndpoint = function(endpoint, query) { // withResponse? boolean that includes Response object in result?
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        let url = new URL(endpoint, Config.ApiServerHost);
        if (typeof query != 'undefined') {
            for (let [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        let p = {
            'method': 'GET',            
        };
        return fetch(url, p)
            .then(response => response.json()
                .then(function(json) {
                    if (!json.result || json.result !== "success")
                        throw `Could not retrieve '${endpoint}'`;
                    delete json.result;
                    return Object.assign(json, { 'timestamp': LocalStorageCache.timestamp(), }); // 'response': response, 
                })
            )
        ;
    };

    /**
     * self.prices = async function({ 'params': params }) {
     *     return AugmentedSteamApi.getEndpoint('v01/prices', params).then(r => r.data);
     * };
     */
    self.endpointFactory = function(endpoint) {
        return async ({ 'params': params }) => self.getEndpoint(endpoint, params).then(result => result.data);
    };

    self.endpointFactoryCached = function(endpoint, ttl, keyfn) {
        return async function({ 'params': params }) {
            let key = keyfn;
            if (typeof keyfn == 'function') {
                key = keyfn(params);
            }
            if (typeof key == 'undefined') {
                throw `Can't cache '${endpoint}' with undefined key`;
            }
            if (progressingRequests.has(key)) {
                return progressingRequests.get(key);
            }
            let val = LocalStorageCache.get(key, ttl);
            if (typeof val !== 'undefined') {
                return val;
            }
            let req = self.getEndpoint(endpoint, params)
                .then(function(result) {
                    LocalStorageCache.set(key, result.data);
                    progressingRequests.delete(key);
                    return result.data;
                });
            progressingRequests.set(key, req);
            return req;
        };
    };

    self.clearEndpointCache = function(keyfn) {
        return async function({ 'params': params }) {
            let key = keyfn;
            if (typeof keyfn == 'function') {
                key = keyfn(params);
            }
            if (typeof key == 'undefined') {
                throw `Can't clear undefined key from cache`;
            }
            progressingRequests.delete(key);
            LocalStorageCache.remove(key);
        };
    };

    self.clear = function() {
        LocalStorageCache.clear();
    };

    function _earlyAccessAppIds() {
        let that = _earlyAccessAppIds;

        // Is a request in progress?
        if (that.promise) { return that.promise; }
        
        // Get data from localStorage
        let appids = LocalStorageCache.get('early_access_appids', 60 * 60); // appids expires after an hour
        if (appids) { return appids; }

        // Cache expired, need to fetch
        that.promise = AugmentedSteamApi.getEndpoint("v01/earlyaccess")
            //.then(response => response.json().then(data => ({ 'result': data.result, 'data': data.data, 'timestamp': LocalStorageCache.timestamp(), })))
            .then(function(appids) {
                appids = Object.keys(appids.data).map(x => parseInt(x, 10)); // convert { "570": 570, } to [570,]
                LocalStorageCache.set("early_access_appids", appids);
                that.promise = null; // no request in progress
                return appids;
            })
            ;
        return that.promise;
    }
    _earlyAccessAppIds.promise = null;

    self.earlyAccessAppIds = async function() {
        return _earlyAccessAppIds();    
    };

    self.dlcInfo = async function({ 'params': params, }) {
        return self.getEndpoint("v01/dlcinfo", params).then(result => result.data);
    }

    Object.freeze(self);
    return self;
})();


const SteamStore = (function() {
    let self = {};

    function _get(endpoint, query) {
        let url = new URL(endpoint, "https://store.steampowered.com/");
        if (typeof query != 'undefined') {
            for (let [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        let p = {
            'method': 'GET',
            'credentials': 'include',
        };
        return fetch(url, p);
    }

    self.getEndpoint = function(endpoint, query) { // withResponse? boolean that includes Response object in result?
        if (!endpoint.endsWith('/'))
            endpoint += '/';
        return _get(endpoint, query).then(response => response.json())
        ;
    };

    self.getPage = function(endpoint, query) { // withResponse? boolean that includes Response object in result?
        return _get(endpoint, query).then(response => response.text())
        ;
    };

    self.appDetails = async function({ 'params': params, }) {
        return self.getEndpoint("/api/appdetails/", params);
    };

    self.appUserDetails = async function({ 'params': params, }) {
        return self.getEndpoint("/api/appuserdetails/", params);
    };

    self.wishlistAdd = async function({ 'params': params, }) {
        let url = new URL("/api/addtowishlist", "https://store.steampowered.com/");
        let formData = new FormData();
        for (let [k, v] of Object.entries(params)) {
            formData.append(k, v);
        }
        let p = {
            'method': 'POST',
            'credentials': 'include',
            'body': formData,
        }
        return fetch(url, p)
            .then(response => response.json());
    };

    self.currencyFromWallet = async function() {
        let html = await self.getPage("/steamaccount/addfunds");
        let dummyPage = document.createElement('html');
        dummyPage.innerHTML = html;

        return dummyPage.querySelector("input[name=currency]").value;
    };

    self.currencyFromApp = async function() {
        let html = await self.getPage("/app/220");
        let dummyPage = document.createElement('html');
        dummyPage.innerHTML = html;

        let currency = dummyPage.querySelector("meta[itemprop=priceCurrency][content]");
        if (!currency || !currency.getAttribute("content")) {
            throw "Store currency could not be determined from app 220";
        }
        return currency.getAttribute("content");
    };

    self.currency = async function() {
        let cache = LocalStorageCache.get('currency', 3600);
        if (cache) return cache;
        let currency = await self.currencyFromWallet();
        if (!currency) currency = await self.currencyFromApp();
        if (!currency) throw "Could not retrieve store currency";
        LocalStorageCache.set('currency', currency);
        return currency;
    };

    Object.freeze(self);
    return self;
})();


const SteamCommunity = (function() {
    let self = {};

    self.getPage = function(endpoint, query) { // withResponse? boolean that includes Response object in result?
        let url = new URL(endpoint, "https://steamcommunity.com/");
        if (typeof query != 'undefined') {
            for (let [k, v] of Object.entries(query)) {
                url.searchParams.append(k, v);
            }
        }
        let p = {
            'method': 'GET',
            'credentials': 'include',
        };
        return fetch(url, p)
            .then(response => response.text())
        ;
    };

    self.cards = function({ 'params': params, }) {
        return self.getPage(`/my/gamecards/${params.appid}`, (params.border ? { 'border': 1, } : undefined));
    };

    self.stats = function({ 'params': params, }) {
        return self.getPage(`/my/stats/${params.appid}`);
    };

    Object.freeze(self);
    return self;
})();


const Steam = (function() {
    let self = {};

    /**
     * Requires user to be signed in, can we validate this from background?
     */
    async function _dynamicstore() {
        let that = _dynamicstore;

        // Is a request in progress?
        if (that.promise) { return that.promise; }
        
        // Get data from localStorage
        let dynamicstore = LocalStorageCache.get('dynamicstore', 15 * 60); // dynamicstore userdata expires after 15 minutes
        if (dynamicstore) { return dynamicstore; }

        // Cache miss, need to fetch
        let url = "https://store.steampowered.com/dynamicstore/userdata/";
        let p = {
            'method': 'GET',
            'credentials': 'include',
        };
        that.promise = fetch(url, p)
            .then(response => response.json())
            .then(function(dynamicstore) {
                if (!dynamicstore.rgOwnedApps) {
                    throw "Could not fetch DynamicStore UserData";
                }
                LocalStorageCache.set("dynamicstore", dynamicstore);
                that.promise = null; // no request in progress
                return dynamicstore;
            })
            ;
        return that.promise;
    }       
    // dynamicstore keys are:
    // "rgWishlist", "rgOwnedPackages", "rgOwnedApps", "rgPackagesInCart", "rgAppsInCart"
    // "rgRecommendedTags", "rgIgnoredApps", "rgIgnoredPackages", "rgCurators", "rgCurations"
    // "rgCreatorsFollowed", "rgCreatorsIgnored", "preferences", "rgExcludedTags",
    // "rgExcludedContentDescriptorIDs", "rgAutoGrantApps"
    _dynamicstore.promise = null;

    self.ignored = async function() {
        return _dynamicstore().then(userdata => Object.keys(userdata.rgIgnoredApps));
    };
    self.owned = async function() {
        return _dynamicstore().then(userdata => userdata.rgOwnedApps);       
    };
    self.wishlist = async function() {
        return _dynamicstore().then(userdata => userdata.rgWishlist);        
    };
    self.dynamicStore = async function() {
        // FIXME, reduce dependence on whole object
        return _dynamicstore();
    };
    self.clearDynamicStore = async function() {
        LocalStorageCache.remove('dynamicstore');
        _dynamicstore.promise = null;
    };
   
    Object.freeze(self);
    return self;
})();

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

    ['api.cache.clear', AugmentedSteamApi.clear],
    ['early_access_appids', AugmentedSteamApi.earlyAccessAppIds],
    ['dlcinfo', AugmentedSteamApi.dlcInfo],
    ['storepagedata', AugmentedSteamApi.endpointFactoryCached('v01/storepagedata', 60*60, appCacheKey)],
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
     
    ['cards', SteamCommunity.cards],
    ['stats', SteamCommunity.stats],
]);
// new Map() for Map.prototype.get() in lieu of:
// Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!sender || !sender.tab) return false; // not from a tab, ignore
    if (!message || !message.action) return false; // no action requested, ignore
  
    let callback = actionCallbacks.get(message.action);
    if (!callback) {
        // requested action not recognized, reply with error immediately
        sendResponse({ 'error': `Did not recognize '${message.action}' as an action.`, });
        return false;
    }

    Promise.resolve(callback(message))
        .then(response => sendResponse({ 'response': response, }))
        .catch(function(err) {
            console.error(err);
            sendResponse({ 'error': "An error occurred in the background context.", }) // can't JSONify most exceptions
        });

    // keep channel open until callback resolves
    return true;
});
