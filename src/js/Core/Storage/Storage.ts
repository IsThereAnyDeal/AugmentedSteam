import {type Storage as StorageTypes, default as browser} from "webextension-polyfill";

export type Key = string;
export type Value = unknown;
export type Store = Map<Key, Value>;

type EventArea = "local" | "managed" | "sync";

const jsonIndentation = 4;

export default abstract class Storage<Defaults extends Record<Key, Value>> implements PromiseLike<Store> {
    private static readonly caches = new Map<StorageTypes.StorageArea, Store>();

    private initialized = false;
    private cache: Store = new Map();

    public constructor(
        private readonly adapter: StorageTypes.StorageArea,
        protected readonly defaults: Defaults,
        private readonly persistent: (Extract<keyof Defaults, string>)[],
    ) {}

    public has(key: keyof Defaults): boolean; // For editor support
    public has(key: Key): boolean;
    public has(key: Key): boolean {
        return this.cache.has(key);
    }

    public get<K extends keyof Defaults>(key: K): Defaults[K]; // For editor support
    public get(key: Key): Value;
    public get(key: Key): Value {
        if (typeof this.cache.get(key) !== "undefined") {
            return this.cache.get(key);
        }
        if (typeof this.defaults[key] === "undefined") {
            console.warn('Unrecognized storage key "%s"', key);
        }
        return this.defaults[key];
    }

    public async set<K extends keyof Defaults>(key: K, value: Defaults[K]): Promise<void>; // For editor support
    public async set(key: Key, value: Value): Promise<void>;
    public async set(key: Key, value: Value): Promise<void> {
        this.cache.set(key, value);
        return this.adapter.set({[key]: value});
    }

    public async import(entries: Store): Promise<void> {
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
        onfulfilled?: ((value: Readonly<Store>) => PromiseLike<TResult1> | TResult1) | null | undefined,
        onrejected?: ((reason: unknown) => PromiseLike<TResult2> | TResult2) | null | undefined,
    ): PromiseLike<TResult1 | TResult2> {
        const promise = this.initialized ? Promise.resolve(this.cache) : this.init();
        this.initialized = true;
        return promise.then(onfulfilled, onrejected);
    }

    public toJson(): string {
        return JSON.stringify(Array.from(this.entries()), null, jsonIndentation);
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
