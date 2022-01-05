import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {LocalStorage} from "../../Core/Storage/LocalStorage";

class CacheStorage extends LocalStorage {

    static isExpired(timestamp, ttl) {
        let _ttl = ttl;
        if (!timestamp) { return true; }
        if (typeof ttl !== "number" || _ttl < 0) { _ttl = 0; }
        return timestamp + _ttl <= TimeUtils.now();
    }

    static get(key) {

        if (typeof this.ttls[key] === "undefined") {
            console.warn("No TTL specified for cache storage key", key);
            return this.defaults[key];
        }

        const item = super.get(key);

        if (!item?.timestamp || this.isExpired(item.timestamp, this.ttls[key])) { return this.defaults[key]; }
        return item.data;
    }

    static set(key, value) {
        return super.set(key, {"data": value, "timestamp": TimeUtils.now()});
    }

    // TODO Remove after some versions
    static migrate() {
        localStorage.removeItem("cache_currency");
    }
}

CacheStorage.ttls = {
    "currency": 60 * 60,
};

CacheStorage.defaults = {
    "currency": null,
};

export {CacheStorage};
