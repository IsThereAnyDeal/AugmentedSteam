import {Info} from "@Core/Info";
import {TimeUtils} from "@Core/Utils/TimeUtils";
import {type IDBPDatabase, type IDBPObjectStore, openDB, type StoreKey, type StoreNames, type StoreValue} from "idb";
import Migration from "@Background/Modules/Db/Migration";
import type {ADB5} from "@Background/Modules/Db/Schemas/ADB5";

type Schema = ADB5;

/**
 *  Object stores in this map won't get checked
 *  for timestamps if cached.
 *  Instead of checking the single entry, the object store itself has
 *  a entry named "expiry".
 *
 *  This allows us to reduce the overhead of having one timestamp for
 *  each individual entry, although they're basically fetched during
 *  the same time.
 */
const timestampedStores = new Map<StoreNames<Schema>, number>([
    ["coupons", 60 * 60],
    ["giftsAndPasses", 60 * 60],
    ["items", 60 * 60],
    ["purchases", 24 * 60 * 60],
    ["dynamicStore", 15 * 60],
    ["collection", 15 * 60],
    ["waitlist", 15 * 60],
    ["storeList", 7 * 24 * 60 * 60],
]);

const timestampedEntriesStores = new Map([
    ["packages", 7 * 24 * 60 * 60],
    ["workshopFileSizes", 5 * 24 * 60 * 60],
    ["reviews", 60 * 60],
]);



export default class IndexedDB {

    private static promise: Promise<void>;

    private static db: IDBPDatabase<Schema>;

    static async init() {
        if (!this.promise) {
            this.promise = (async () => {
                this.db = await openDB<Schema>("Augmented Steam", Info.db_version, {
                    upgrade: Migration.upgrade,
                    blocked() {
                        console.error("Failed to upgrade database, there is already an open connection");
                    },
                });

                await IndexedDB.cleanup();
            })();
        }

        return this.promise;
    }

    static then(
        onDone: (value: void) => PromiseLike<void>,
        onCatch: (reason: any) => PromiseLike<never>
    ): Promise<void> {
        return IndexedDB.init().then(onDone, onCatch);
    }

    private static async cleanup() {
        const promises = [];

        const tx = this.db.transaction(this.db.objectStoreNames, "readwrite");

        let cursor = await tx.objectStore("expiries")
            .index("expiry")
            .openCursor(IDBKeyRange.upperBound(TimeUtils.now()));

        while (cursor) {
            let storeName = cursor.key as unknown as StoreNames<Schema>;

            if (this.db.objectStoreNames.contains(storeName)) {
                if (cursor.value.key) {
                    promises.push(tx.objectStore(storeName).delete(cursor.value.key));
                } else {
                    promises.push(tx.objectStore(storeName).clear());
                }
            }
            promises.push(cursor.delete());
            cursor = await cursor.continue();
        }

        return Promise.all(promises);
    }

    static async isStoreExpired<StoreName extends StoreNames<Schema>>(
        storeName: StoreName
    ): Promise<boolean> {
        let expiry = await this.db.get("expiries", storeName);
        return !expiry || TimeUtils.isInPast(expiry);
    }

    static async setStoreExpiry(storeName: StoreNames<Schema>, ttlSeconds: number) {
        return this.db.put("expiries", TimeUtils.now() + ttlSeconds, storeName);
    }

    static async put<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        value: StoreValue<Schema, StoreName>,
        key?: StoreKey<Schema, StoreName>
    ): Promise<void> {
        await this.db.put(storeName, value, key);
    }

    static async putAll<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        data: Array<[
            StoreKey<Schema, StoreName>,
            StoreValue<Schema, StoreName>
        ]>
    ): Promise<void> {
        const tx = this.db.transaction(storeName);
        const store = tx.store;

        await store.clear();

        await Promise.all(
            data.map(([key, value]) => store.put(value, key))
        );

        await tx.done;
    }

    static async get<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        key: StoreKey<Schema, StoreName>
    ): Promise<StoreValue<Schema, StoreName>|undefined> {
        return await this.db.get(storeName, key);
    }

    static async getAll<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        keys: Array<StoreKey<Schema, StoreName>>
    ) {
        let cursor;

        cursor = await IndexedDB.db.transaction(storeName).store.openCursor();

        while (cursor) {
            keys.push(cursor.key);
            values.push(cursor.value);

            cursor = await cursor.continue();
        }

        return IndexedDB._resultsAsObject(keys, await Promise.all(values));
    }

    static async getFromIndex(storeName, indexName, key, options = {}) {

        // It doesn't make sense to query on an index from a timestamped entry store, since the data is not complete
        if (IndexedDB.timestampedEntriesStores.has(storeName)) { return null; }

        await IndexedDB.checkStoreExpiry(storeName, options);

        const keys = IndexedDB._asArray(key);
        const index = IndexedDB.db.transaction(storeName).store.index(indexName);

        const values = await Promise.all(keys.map(key => {
            if (options.asKey) {
                if (options.all) {
                    return index.getAllKeys(key);
                }
                return index.getKey(key);
            }

            if (options.all) {
                return index.getAll(key);
            }

            return index.get(key);
        }));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async indexContainsKey(storeName, indexName, key, options = {}) {

        // It doesn't make sense to query on an index from a timestamped entry store, since the data is not complete
        if (IndexedDB.timestampedEntriesStores.has(storeName)) { return null; }

        await IndexedDB.checkStoreExpiry(storeName, options);

        const keys = IndexedDB._asArray(key);
        const index = IndexedDB.db.transaction(storeName).store.index(indexName);

        const values = await Promise.all(keys.map(key => index.openKeyCursor(key)
            .then(cursor => Boolean(cursor))));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async delete<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        key: StoreKey<Schema, StoreName>
    ): Promise<void> {
        await this.db.delete(storeName, key);
    }

    static clear<StoreName extends StoreNames<Schema>>(
        storeName: StoreName
    ): Promise<void> {
        return this.db.clear(storeName);
    }

    static async contains<
        StoreName extends StoreNames<Schema>,
        Key extends string|number
    >(
        storeName: StoreName,
        keys: Key[]
    ): Promise<Record<Key, boolean>> {
        const tx = this.db.transaction(storeName);
        const store = tx.store;

        return Object.fromEntries(await Promise.all(
            keys.map(async key => [key, undefined !== (await store.getKey(key as unknown as StoreKey<Schema, StoreName>))]
        )));
    }

    static async checkEntryExpiry(storeName, keys, options = {}) {

        if (!IndexedDB.timestampedEntriesStores.has(storeName)) { return null; }

        const tx = IndexedDB.db.transaction("expiries");
        const expired = [];

        for (const key of keys) {
            tx.store.get(`${storeName}_${key}`).then(expiry => {
                if (!expiry || IndexedDB.isExpired(expiry)) {
                    expired.push(key);
                }
            });
        }

        await tx.done;

        if (options.preventFetch) {
            const dataTx = IndexedDB.db.transaction(storeName, "readwrite");

            for (const key of expired) {
                dataTx.store.delete(key);
            }

            return dataTx.done;
        }

        return Promise.all(expired.map(key => IndexedDB.fetchUpdatedData(storeName, key, options.params)));
    }






    static async checkStoreExpiry(storeName, options = {}) {

        if (!IndexedDB.timestampedStores.has(storeName)) { return null; }

        const expiry = await IndexedDB.db.get("expiries", storeName);

        if (!expiry || IndexedDB.isExpired(expiry)) {
            await IndexedDB.clear(storeName);
            if (!options.preventFetch) {
                return IndexedDB.fetchUpdatedData(storeName, null, options.params);
            }
        }

        return null;
    }







    static fetchUpdatedData(storeName, key, params) {

        const requestKey = key ? `${storeName}_${key}` : storeName;
        if (IndexedDB._ongoingRequests.has(requestKey)) {
            return IndexedDB._ongoingRequests.get(requestKey);
        }

        let req;
        const timestampedStore = IndexedDB.timestampedStores.has(storeName);
        if (timestampedStore) {
            req = IndexedDB.objStoreFetchFns.get(storeName)({params});
        } else {
            req = IndexedDB.objStoreFetchFns.get(storeName)({params, key});
        }
        req = req
            .catch(async err => {
                console.group("Object store data");
                if (key) {
                    console.error("Failed to update key %s of object store %s", key, storeName);
                } else {
                    console.error("Failed to update object store %s", storeName);
                }
                console.error(err);
                console.groupEnd();

                // Wait some seconds before retrying
                await IndexedDB.db.put("expiries", TimeUtils.now() + 60, timestampedStore ? storeName : `${storeName}_${key}`);

                throw err;
            })
            .finally(() => IndexedDB._ongoingRequests.delete(requestKey));
        IndexedDB._ongoingRequests.set(requestKey, req);
        return req;
    }

    // TODO Move into TimeUtils
    static isExpired(expiry) {
        return expiry <= TimeUtils.now();
    }

    static _asArray(key) {
        return Array.isArray(key) ? key : [key];
    }

    static _resultsAsObject(keys, values) {
        return keys.reduce((acc, key, i) => {
            acc[key] = values[i];
            return acc;
        }, {});
    }
}
