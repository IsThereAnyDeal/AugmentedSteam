
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

export {LocalStorage};
