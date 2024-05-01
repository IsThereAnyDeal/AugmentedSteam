import {Info} from "@Core/Info";
import {TimeUtils} from "@Core/Utils/TimeUtils";
import {
    type IDBPDatabase,
    type IndexKey,
    type IndexNames,
    openDB,
    type StoreKey,
    type StoreNames,
    type StoreValue
} from "idb";
import Migration from "@Background/Modules/Db/Migration";
import type {ADB5} from "@Background/Modules/Db/Schemas/ADB5";

type Schema = ADB5;

export default class IndexedDB {

    private static promise: Promise<void>;

    public static db: IDBPDatabase<Schema>;

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

    static async putMany<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        data: Array<[
            StoreKey<Schema, StoreName>,
            StoreValue<Schema, StoreName>
        ]>
    ): Promise<void> {
        const tx = this.db.transaction(storeName, "readwrite");
        const store = tx.store;

        await Promise.all(
            data.map(([key, value]) => store.put(value, key))
        );

        await tx.done;
    }

    static async replaceAll<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        data: Array<[
            StoreKey<Schema, StoreName>,
            StoreValue<Schema, StoreName>
        ]>
    ): Promise<void> {
        const tx = this.db.transaction(storeName, "readwrite");
        const store = tx.store;

        await store.clear();

        if (data.length > 0) {
            await Promise.all(
                data.map(([key, value]) => store.put(value, key))
            );
        }

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
    ): Promise<Record<
        StoreKey<Schema, StoreName>,
        StoreValue<Schema, StoreName>|undefined
    >> {
        let cursor = await IndexedDB.db.transaction(storeName).store.openCursor();

        let result = Object.fromEntries(keys.map(k => [k, undefined]));

        while (cursor) {
            // @ts-ignore
            result[cursor.key] = cursor.value;
            cursor = await cursor.continue();
        }

        // @ts-ignore
        return result;
    }

    static async getFromIndex<
        StoreName extends StoreNames<Schema>,
        IndexName extends IndexNames<Schema, StoreName>
    >(
        storeName: StoreName,
        indexName: IndexName,
        key: IndexKey<Schema, StoreName, IndexName>,
    ): Promise<StoreValue<Schema, StoreName>|undefined> {

        const tx = this.db.transaction(storeName);
        const idx = tx.store.index(indexName);
        return await idx.get(key);
    }

    static async delete<StoreName extends StoreNames<Schema>>(
        storeName: StoreName,
        ...key: StoreKey<Schema, StoreName>[]
    ): Promise<void> {
        for (let key_ of key) {
            await this.db.delete(storeName, key_);
        }
    }

    static async clear<StoreName extends StoreNames<Schema>>(
        ...storeName: StoreName[]
    ): Promise<void> {
        for (let store of storeName) {
            await this.db.clear(store);
        }
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
}
