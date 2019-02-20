
const TimeHelper = {
    timestamp() {
        return Math.trunc(Date.now() / 1000);
    },
    isExpired(updateTime, expiration) {
        if (!updateTime) return true;
        return updateTime < this.timestamp() - expiration;
    }
};
Object.freeze(TimeHelper);


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

    self.clear = function() {
        localStorage.clear();
    };

    Object.freeze(self);
    return self;
})();


const AugmentedSteamApi = (function() {
    let self = {};

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
                    return Object.assign(json, { 'timestamp': TimeHelper.timestamp(), }); // 'response': response, 
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
            let val = LocalStorage.get(key);
            if (val && val.timestamp && !TimeHelper.isExpired(val.timestamp, ttl)) {
                return val.data;
            }
            return self.getEndpoint(endpoint, params)
                .then(function(result) {
                    LocalStorage.set(key, result);
                    return result.data;
                });

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
            LocalStorage.remove(key);
        };
    }

    Object.freeze(self);
    return self;
})();


const SteamStoreApi = (function() {
    let self = {};

    self.getEndpoint = function(endpoint, query) { // withResponse? boolean that includes Response object in result?
        if (!endpoint.endsWith('/'))
            endpoint += '/';
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
        return fetch(url, p)
            .then(response => response.json())
        ;
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
    }

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
        // Is data already in scope because of previous request?
        if (that.data && !that.isExpired()) { return that.data; }

        // Is a request in progress?
        if (that.promise) { return that.promise; }
        
        // Get data from localStorage
        let dynamicstore = LocalStorage.get('dynamicstore');
        if (dynamicstore) {
            Object.assign(that, {
                'data': dynamicstore.data,
                'timestamp': dynamicstore.timestamp,
            });
            if (that.data && !that.isExpired()) { return that.data; }
        }

        // Cache expired, need to fetch
        let url = "https://store.steampowered.com/dynamicstore/userdata/";
        let p = {
            'method': 'GET',
            'credentials': 'include',
        };
        that.promise = fetch(url, p)
            .then(response => response.json().then(data => ({ 'data': data, 'timestamp': TimeHelper.timestamp(), })))
            .then(function(dynamicstore) {
                if (!dynamicstore.data.rgOwnedApps) {
                    throw "Could not fetch DynamicStore UserData";
                }
                LocalStorage.set("dynamicstore", dynamicstore);
                Object.assign(_dynamicstore, {
                    'data': dynamicstore.data,
                    'timestamp': dynamicstore.timestamp,
                    'promise': null, // no request in progress
                });
                return dynamicstore.data;
            })
            ;
        return that.promise;
    }       
    // _dynamicstore.data keys are:
    // "rgWishlist", "rgOwnedPackages", "rgOwnedApps", "rgPackagesInCart", "rgAppsInCart"
    // "rgRecommendedTags", "rgIgnoredApps", "rgIgnoredPackages", "rgCurators", "rgCurations"
    // "rgCreatorsFollowed", "rgCreatorsIgnored", "preferences", "rgExcludedTags",
    // "rgExcludedContentDescriptorIDs", "rgAutoGrantApps"
    _dynamicstore.data = null;
    _dynamicstore.timestamp = 0;
    _dynamicstore.EXPIRY = 15 * 60; // dynamicstore userdata expires after 15 minutes
    _dynamicstore.isExpired = function() { return TimeHelper.isExpired(this.timestamp, this.EXPIRY); };
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
        LocalStorage.remove('dynamicstore');
        _dynamicstore.data = null;
        _dynamicstore.timestamp = 0;
        _dynamicstore.promise = null;
    };

    function _earlyAccessAppIds() {
        let that = _earlyAccessAppIds;
        // Is data already in scope because of previous request?
        if (that.data && !that.isExpired()) { return that.data; }
        
        // Is a request in progress?
        if (that.promise) { return that.promise; }
        
        // Get data from localStorage
        let appids = LocalStorage.get('early_access_appids');
        if (appids) {
            Object.assign(that, {
                'data': appids.data,
                'timestamp': appids.timestamp,
            });
            if (that.data && !that.isExpired()) { return that.data; }
        }

        // Cache expired, need to fetch
        that.promise = AugmentedSteamApi.getEndpoint("v01/earlyaccess")
            //.then(response => response.json().then(data => ({ 'result': data.result, 'data': data.data, 'timestamp': TimeHelper.timestamp(), })))
            .then(function(appids) {
                delete appids.response;
                appids.data = Object.keys(appids.data).map(x => parseInt(x, 10)); // convert { "570": 570, } to [570,]
                LocalStorage.set("early_access_appids", appids);
                Object.assign(that, {
                    'data': appids.data,
                    'timestamp': appids.timestamp,
                    'promise': null, // no request in progress
                });
                return appids.data;
            })
            ;
        return that.promise;
    }
    _earlyAccessAppIds.data = null;
    _earlyAccessAppIds.timestamp = 0;
    _earlyAccessAppIds.EXPIRY = 60 * 60; // appids expires after an hour
    _earlyAccessAppIds.isExpired = function() { return TimeHelper.isExpired(this.timestamp, this.EXPIRY); };

    self.earlyAccessAppIds = async function() {
        return _earlyAccessAppIds();    
    };
   
    Object.freeze(self);
    return self;
})();

let profileCacheKey = (params => `profile_${params.profile}`);

let actionCallbacks = new Map([
    ['ignored', Steam.ignored],
    ['owned', Steam.owned],
    ['wishlist', Steam.wishlist],
    ['wishlist.add', SteamStoreApi.wishlistAdd],
    ['dynamicstore', Steam.dynamicStore],
    ['dynamicstore.clear', Steam.clearDynamicStore],

    ['early_access_appids', Steam.earlyAccessAppIds],
    ['prices', AugmentedSteamApi.endpointFactory('v01/prices')],
    ['profile', AugmentedSteamApi.endpointFactoryCached('v01/profile/profile', 24*60*60, profileCacheKey)],
    ['profile.clear', AugmentedSteamApi.clearEndpointCache(profileCacheKey)],
    ['profile.background', AugmentedSteamApi.endpointFactory('v01/profile/background/background')],
    ['profile.background.games', AugmentedSteamApi.endpointFactory('v01/profile/background/games')],
    ['twitch.stream', AugmentedSteamApi.endpointFactory('v01/twitch/stream')],
    ['market.cardprices', AugmentedSteamApi.endpointFactory('v01/market/cardprices')],
    ['market.averagecardprice', AugmentedSteamApi.endpointFactory('v01/market/averagecardprice')], // FIXME deprecated
    ['market.averagecardprices', AugmentedSteamApi.endpointFactory('v01/market/averagecardprices')],

    ['appuserdetails', SteamStoreApi.appUserDetails],
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
