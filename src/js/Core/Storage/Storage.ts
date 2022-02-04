import type {Storage as StorageTypes} from "webextension-polyfill";
import browser from "webextension-polyfill";

export type Key = string | number | symbol;
export type Value = unknown;
export type Store = Map<Key, Value>;

export type ValueOf<T> = T[keyof T];

type EventArea = "sync" | "local" | "managed";

export default abstract class Storage<Defaults extends Record<Key, Value>> implements PromiseLike<Store> {

    private static readonly caches: Map<StorageTypes.StorageArea, Store> = new Map();

    protected readonly defaults: Readonly<Map<keyof Defaults, ValueOf<Defaults>>>;

    private initialized = false;
    private cache: Store = new Map();

    public constructor(
        private readonly adapter: Readonly<StorageTypes.StorageArea>,
        defaults: Readonly<Defaults>,
        private readonly persistent: readonly (keyof Defaults)[],
    ) {
        this.defaults = new Map(Object.entries(defaults));
    }

    public has(key: keyof Defaults): boolean; // For editor support
    public has(key: Key): boolean;
    public has(key: Key): boolean {
        return this.cache.has(key);
    }

    public get(key: keyof Defaults): Value; // For editor support
    public get(key: Key): Value;
    public get(key: Key): Value {
        if (typeof this.cache.get(key) !== "undefined") {
            return this.cache.get(key);
        }
        if (typeof this.defaults.get(key) === "undefined") {
            console.warn('Unrecognized storage key "%s"', key);
        }
        return this.defaults.get(key);
    }

    public async set(key: keyof Defaults, value: ValueOf<Defaults>): Promise<void>; // For editor support
    public async set(key: Key, value: Value): Promise<void>;
    public async set(key: Key, value: Value): Promise<void> {
        this.cache.set(key, value);
        return this.adapter.set({[key]: value});
    }

    public async import(entries: Readonly<Store>): Promise<void> {
        for (const [key, value] of Object.entries(entries)) {
            this.cache.set(key, value);
        }
        return this.adapter.set(entries);
    }

    public async remove(key: keyof Defaults): Promise<void>; // For editor support
    public async remove(key: Key): Promise<void>;
    public async remove(key: Key): Promise<void> {
        this.cache.delete(key);
        return this.adapter.remove(key.toString());
    }

    public keys(prefix = ""): Key[] {
        return Array.from(this.cache.keys()).filter(k => k.toString().startsWith(prefix));
    }

    public entries(): IterableIterator<[Key, Value]> {
        return this.cache.entries();
    }

    public async clear(clearPersistent = false): Promise<void> {
        let persistentEntries;
        if (!clearPersistent) {
            persistentEntries = new Map(this.persistent.map(option => [option, this.cache.get(option)]));
        }

        await this.adapter.clear();
        this.cache = new Map();

        if (!clearPersistent) {
            // @ts-expect-error Narrowing isn't working here, persistentEntries should be well defined in this branch
            await this.import(persistentEntries);
        }
    }

    public then<TResult1 = Store, TResult2 = never>(
        onfulfilled?: ((value: Readonly<Store>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): PromiseLike<TResult1 | TResult2> {
        const promise = this.initialized ? Promise.resolve(this.cache) : this.init();
        this.initialized = true;
        return promise.then(onfulfilled, onrejected);
    }

    public toJson(): string {
        return JSON.stringify(Array.from(this.entries()));
    }

    protected async init(): Promise<Store> {

        const adapter = this.adapter;
        const cache = Storage.caches.get(adapter);

        if (typeof cache !== "undefined") {
            this.cache = cache;
            return this.cache;
        }

        this.cache = new Map();
        Storage.caches.set(adapter, this.cache);

        browser.storage.onChanged.addListener((
            changes: Readonly<Record<string, Readonly<StorageTypes.StorageChange>>>,
            eventArea
        ) => {

            if (adapter !== browser.storage[eventArea as EventArea]) { return; }

            for (const [key, {"newValue": val}] of Object.entries(changes)) {
                this.cache.set(key, val);
            }
        });

        for (const [key, value] of Object.entries(await this.adapter.get(null))) {
            this.cache.set(key, value);
        }

        await this.migrate();

        return this.cache;
    }

    protected async migrate(): Promise<void> {
        // Implemented by subclasses
    }
}
