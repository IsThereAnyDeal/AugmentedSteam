
class CookieStorage {

    static get(name, defaultValue) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        const _name = name.trim();
        if (!CookieStorage.cache.has(_name)) {
            return defaultValue;
        }
        return CookieStorage.cache.get(_name);
    }

    static set(name, val, ttl = 60 * 60 * 24 * 365) {
        if (CookieStorage.cache.size === 0) {
            CookieStorage.init();
        }
        let _name = name.trim();
        let _val = val.trim();
        CookieStorage.cache.set(_name, _val);
        _name = encodeURIComponent(_name);
        _val = encodeURIComponent(_val);
        document.cookie = `${_name}=${_val}; max-age=${ttl}`;
    }

    static remove(name) {
        let _name = name.trim();
        CookieStorage.cache.delete(_name);
        _name = encodeURIComponent(_name);
        document.cookie = `${_name}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    static init() {
        CookieStorage.cache.clear();
        for (let [key, val] of document.cookie.split(";").map(kv => kv.split("="))) {
            key = key.trim();
            CookieStorage.cache.set(key, decodeURIComponent(val));
        }
    }
}

CookieStorage.cache = new Map();

export {CookieStorage};
