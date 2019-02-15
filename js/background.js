
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


const Steam = (function() {
    let self = {};

    /**
     * Requires user to be signed in, can we validate this from background?
     */
    async function _dynamicstore() {
        // Is data already in scope because of previous request?
        if (_dynamicstore.data && !_dynamicstore.isExpired()) { return _dynamicstore.data; }

        // Is a request in progress?
        if (_dynamicstore.promise) { return _dynamicstore.promise; }
        
        // Get data from localStorage
        let dynamicstore = LocalStorage.get('dynamicstore');
        if (dynamicstore) {
            Object.assign(_dynamicstore, {
                'data': dynamicstore.data,
                'timestamp': dynamicstore.timestamp,
            });
            if (_dynamicstore.data && !_dynamicstore.isExpired()) { return _dynamicstore.data; }
        }

        // Cache expired, need to fetch
        let url = "https://store.steampowered.com/dynamicstore/userdata/";
        let p = {
            'method': 'GET',
            'credentials': 'include',
        };
        _dynamicstore.promise = fetch(url, p)
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
        return _dynamicstore.promise;
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
    self.clearDynamicStore = async function() {
        LocalStorage.remove('dynamicstore');
        _dynamicstore.data = null;
        _dynamicstore.timestamp = 0;
        _dynamicstore.promise = null;
    };

    Object.freeze(self);
    return self;
})();



let actionCallbacks = new Map([
    ['ignored', Steam.ignored],
    ['owned', Steam.owned],
    ['wishlist', Steam.wishlist],
    ['dynamicstore.clear', Steam.clearDynamicStore],

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
