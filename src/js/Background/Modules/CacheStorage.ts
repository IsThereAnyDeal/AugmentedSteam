import {TimeUtils} from "../../modulesCore";
import {LocalStorage} from "../../Core/Storage/LocalStorage";

import type {Key, Value, ValueOf} from "../../Core/Storage/Storage";

interface Timestamped {
    "timestamp": number;
    "data": unknown;
}

export class CacheStorage<Defaults extends Record<Key, Value>> extends LocalStorage<Defaults> {

    private readonly ttls: Readonly<Map<keyof Defaults, number>>;

    public constructor(
        defaults: Readonly<Defaults>,
        persistent: readonly (keyof Defaults)[],
        ttls: Readonly<Record<keyof Defaults, number>>,
    ) {
        super(
            defaults,
            persistent
        );

        this.ttls = new Map(Object.entries(ttls));
    }

    public override get(key: keyof Defaults): Value; // For editor support
    public override get(key: Key): Value;
    public override get(key: Key): Value {

        if (typeof this.ttls.get(key) === "undefined") {
            console.warn("No TTL specified for cache storage key", key);
            return this.defaults.get(key);
        }

        const item = super.get(key);

        if (!this.isTimestamped(item)) {
            return this.defaults.get(key);
        }

        const ttl = this.ttls.get(key);
        if (typeof ttl === "undefined" || this.isExpired(item.timestamp, ttl)) {
            return this.defaults.get(key);
        }

        return item.data;
    }

    public override async set(key: keyof Defaults, value: ValueOf<Defaults>): Promise<void>; // For editor support
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
        return typeof (obj as Timestamped).timestamp === "number"
            && typeof (obj as Timestamped).data !== "undefined";
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
