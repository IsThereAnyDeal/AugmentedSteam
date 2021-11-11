
// TODO use https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
class LocalStorage {
    static get(key, defaultValue) {
        const item = localStorage.getItem(key);
        if (!item) { return defaultValue; }
        try {
            return JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static has(key) {
        return localStorage.getItem(key) !== null;
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static keys() {
        const result = [];
        for (let i = localStorage.length - 1; i >= 0; --i) {
            result.push(localStorage.key(i));
        }
        return result;
    }

    static clear() {
        localStorage.clear();
    }
}

LocalStorage.defaults = Object.freeze({
    "access_token": null,
    "lastItadImport": {"from": null, "to": null},
    "login": {"steamId": null, "profilePath": null},
    "storeCountry": null,
    "expand_slider": false,
    "es_guide_tags": {}, // TODO remove prefix
    "market_stats": {"startListing": null, "purchaseTotal": 0, "saleTotal": 0},
    "popular_refresh": false,
    "workshop_state": "",
    "playback_hd": false,
    "show_review_section": true,
    "steampeek": false,
    "support_info": null,
    "hide_login_warn_store": false,
    "hide_login_warn_community": false,
});

export {LocalStorage};
