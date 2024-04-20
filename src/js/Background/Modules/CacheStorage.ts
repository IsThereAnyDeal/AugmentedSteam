import {TimeUtils} from "../../modulesCore";
import {LocalStorage} from "../../Core/Storage/LocalStorage";

import type {Key, Value} from "@Core/Storage/Storage";

interface Timestamped {
    "timestamp": number;
    "data": unknown;
}

class CacheStorage<Defaults extends Record<Key, Value>> extends LocalStorage<Defaults> {

    private readonly ttls: Readonly<Map<keyof Defaults, number>>;

    public constructor(
        defaults: Defaults,
        persistent: (Extract<keyof Defaults, string>)[],
        ttls: Record<keyof Defaults, number>,
    ) {
        super(
            defaults,
            persistent,
        );

        this.ttls = new Map(Object.entries(ttls));
    }

    public override get<K extends keyof Defaults>(key: K): Defaults[K]; // For editor support
    public override get(key: Key): Value;
    public override get(key: Key): Value {

        if (typeof this.ttls.get(key) === "undefined") {
            console.warn("No TTL specified for cache storage key", key);
            return this.defaults[key];
        }

        const item = super.get(key);

        if (!this.isTimestamped(item)) {
            return this.defaults[key];
        }

        const ttl = this.ttls.get(key);
        if (typeof ttl === "undefined" || this.isExpired(item.timestamp, ttl)) {
            return this.defaults[key];
        }

        return item.data;
    }

    public override async set<K extends keyof Defaults>(key: K, value: Defaults[K]): Promise<void>; // For editor support
    public override async set(key: Key, value: Value): Promise<void>;
    public override async set(key: Key, value: Value): Promise<void> {
        return super.set(key, {"data": value, "timestamp": TimeUtils.now()});
    }

    // TODO Remove after some versions
    protected override async migrate(): Promise<void> {
        localStorage.removeItem("cache_currency");
        return Promise.resolve();
    }

    private isExpired(timestamp: number, ttl: number): boolean {
        return timestamp + ttl <= TimeUtils.now();
    }

    private isTimestamped(obj: unknown): obj is Timestamped {
        return obj !== null && typeof obj === "object"
            && "timestamp" in obj && typeof obj.timestamp === "number"
            && "data" in obj && typeof obj.data !== "undefined";
    }
}

const DEFAULTS = {
    "currency": null,
};

const PERSISTENT: (keyof typeof DEFAULTS)[] = [];

const TTLS = {
    "currency": 60 * 60,
};

export default new CacheStorage(
    DEFAULTS,
    PERSISTENT,
    TTLS,
);
