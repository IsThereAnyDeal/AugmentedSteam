
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






chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!sender.tab) return false; // not from a tab, ignore
    if (!message.action) return false; // no action requested, ignore

    // Object.prototype.hasOwnProperty.call(actionCallbacks, message.action)
    let callback = actionCallbacks.get(message.action);
    if (!callback) {
        // requested action not recognized, reply with error immediately
        sendResponse({ 'error': `Did not recognize '${message.action}' as an action.`, });
        return false;
    }

    callback(message)
        .then(response => sendResponse({ 'response': response, }))
        .catch(err => sendResponse({ 'error': err, }));

    // keep channel open until callback resolves
    return true;
});
