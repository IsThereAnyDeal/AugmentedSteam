
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

    self.ignored = async function() {
      
    };
    self.owned = async function() {
      
    };
    self.wishlist = async function() {
      
    };
    self.clearDynamicStore = async function() {

    };

    Object.freeze(self);
    return self;
})();



let actionCallbacks = new Map([
    ['wishlist', Steam.wishlist],
    ['wishlist.clear', Steam.clearDynamicStore],

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
        .catch(err => sendResponse({ 'error': err, }));

    // keep channel open until callback resolves
    return true;
});
