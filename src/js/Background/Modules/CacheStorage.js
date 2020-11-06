import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {LocalStorage} from "../../Core/Storage/LocalStorage";

class CacheStorage {

    static isExpired(timestamp, ttl) {
        let _ttl = ttl;
        if (!timestamp) { return true; }
        if (typeof ttl !== "number" || _ttl < 0) { _ttl = 0; }
        return timestamp + _ttl <= TimeUtils.now();
    }

    static get(key, ttl, defaultValue) {
        if (!ttl) { return defaultValue; }
        let item = localStorage.getItem(`cache_${key}`);
        if (!item) { return defaultValue; }
        try {
            item = JSON.parse(item);
        } catch (err) {
            return defaultValue;
        }
        if (!item.timestamp || CacheStorage.isExpired(item.timestamp, ttl)) { return defaultValue; }
        return item.data;
    }

    static set(key, value) {
        localStorage.setItem(`cache_${key}`, JSON.stringify({"data": value, "timestamp": TimeUtils.now()}));
    }

    static remove(key) {
        localStorage.removeItem(`cache_${key}`);
    }

    static keys() {
        return LocalStorage.keys()
            .filter(k => k.startsWith("cache_"))
            .map(k => k.substring(6)); // "cache_".length == 6
    }

    static clear() {
        const keys = CacheStorage.keys();
        for (const key of keys) {
            CacheStorage.remove(key);
        }
    }
}

export {CacheStorage};
