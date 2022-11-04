import {Info} from "../../Core/Info";
import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {openDB} from "idb";

class IndexedDB {

    static init() {
        if (IndexedDB._promise) { return IndexedDB._promise; }
        IndexedDB._promise = openDB("Augmented Steam", Info.db_version, {
            upgrade(db, oldVersion, newVersion, tx) {
                if (oldVersion < 1) {
                    db.createObjectStore("coupons").createIndex("appid", "appids", {"unique": false, "multiEntry": true});
                    db.createObjectStore("giftsAndPasses").createIndex("appid", "", {"unique": false, "multiEntry": true});
                    db.createObjectStore("items");
                    db.createObjectStore("earlyAccessAppids");
                    db.createObjectStore("purchases");
                    db.createObjectStore("dynamicStore").createIndex("appid", "", {"unique": false, "multiEntry": true});
                    db.createObjectStore("packages").createIndex("expiry", "expiry");
                    db.createObjectStore("storePageData").createIndex("expiry", "expiry");
                    db.createObjectStore("profiles").createIndex("expiry", "expiry");
                    db.createObjectStore("rates");
                    db.createObjectStore("notes");
                    db.createObjectStore("collection");
                    db.createObjectStore("waitlist");
                    db.createObjectStore("itadImport");
                }

                if (oldVersion < 2) {
                    db.createObjectStore("workshopFileSizes").createIndex("expiry", "expiry");
                    db.createObjectStore("reviews").createIndex("expiry", "expiry");
                }

                if (oldVersion < 3) {
                    db.createObjectStore("expiries").createIndex("expiry", "");

                    tx.objectStore("packages").deleteIndex("expiry");
                    tx.objectStore("storePageData").deleteIndex("expiry");
                    tx.objectStore("profiles").deleteIndex("expiry");
                    tx.objectStore("workshopFileSizes").deleteIndex("expiry");
                    tx.objectStore("reviews").deleteIndex("expiry");
                }
            },
            blocked() {
                console.error("Failed to upgrade database, there is already an open connection");
            },
        })
            .then(db => { IndexedDB.db = db; })
            .then(IndexedDB._deleteOldData);

        return IndexedDB._promise;
    }

    static then(onDone, onCatch) {
        return IndexedDB.init().then(onDone, onCatch);
    }

    static async _deleteOldData() {
        const expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        let cursor = await expiryStore.index("expiry").openCursor(IDBKeyRange.upperBound(TimeUtils.now()));
        const expired = [];
        const stores = {};
        const promises = [];

        while (cursor) {
            expired.push(cursor.primaryKey);
            promises.push(expiryStore.delete(cursor.primaryKey));
            cursor = await cursor.continue();
        }

        for (const expiryKey of expired) {
            const [storeName, key] = expiryKey.split(/_/);
            if (!stores[storeName]) {
                stores[storeName] = [];
            }

            if (key) {
                stores[storeName].push(key);
            }
        }

        for (const [storeName, keys] of Object.entries(stores)) {

            const dataStore = IndexedDB.db.transaction(storeName, "readwrite").store;

            if (IndexedDB.timestampedStores.has(storeName)) {
                promises.push(dataStore.clear());
            } else {
                promises.push(Promise.all(keys.map(key => {

                    const strKeyPromise = dataStore.delete(key);

                    const nmbKey = Number(key);
                    if (nmbKey) {
                        return Promise.all([
                            strKeyPromise,
                            dataStore.delete(nmbKey),
                        ]);
                    }

                    return strKeyPromise;
                })));
            }
        }

        return Promise.all(promises);
    }

    static async put(storeName, data, {ttl, multiple = typeof data === "object"} = {}) {
        const tx = IndexedDB.db.transaction(storeName, "readwrite");

        let expiry;
        const expiryKeys = [];

        const cached = IndexedDB.cacheObjectStores.has(storeName);
        const timestampedEntry = IndexedDB.timestampedEntriesStores.has(storeName);

        function nonAssociativeData(data) {
            let promise;
            if (tx.store.autoIncrement || tx.store.keyPath !== null) {
                promise = tx.store.put(data);
            } else {
                promise = tx.store.put(null, data);
            }
            promise.then(key => {
                if (timestampedEntry) { expiryKeys.push(`${storeName}_${key}`); }
            });
        }

        if (cached) {
            const _ttl = ttl || IndexedDB.cacheObjectStores.get(storeName);
            expiry = TimeUtils.now() + _ttl;

            if (!timestampedEntry) {
                expiryKeys.push(storeName);
            }
        }

        if (multiple) {
            if (Array.isArray(data)) {
                data.forEach(nonAssociativeData);
            } else if (typeof data === "object") {
                const entries = data instanceof Map ? data.entries() : Object.entries(data);
                for (const [key, value] of entries) {
                    tx.store.put(value, key).then(key => {
                        if (timestampedEntry) { expiryKeys.push(`${storeName}_${key}`); }
                    });
                }
            } else {
                console.warn("multiple parameter specified but the data is a primitive");
            }
        } else {
            nonAssociativeData(data);
        }

        await tx.done;

        const expiryTx = IndexedDB.db.transaction("expiries", "readwrite");

        for (const key of expiryKeys) {
            expiryTx.store.put(expiry, key);
        }

        return expiryTx.done;
    }

    static async get(storeName, key, options = {}) {
        const keys = IndexedDB._asArray(key);

        await Promise.all([
            IndexedDB.checkStoreExpiry(storeName, options),
            IndexedDB.checkEntryExpiry(storeName, keys, options),
        ]);

        const store = IndexedDB.db.transaction(storeName).store;
        const values = await Promise.all(keys.map(key => store.get(key)));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
    }

    static async getAll(storeName, options = {}) {
        const keys = [];
        const values = [];
        let cursor;

        await IndexedDB.checkStoreExpiry(storeName, options);

        if (IndexedDB.timestampedEntriesStores.has(storeName)) {
            await IndexedDB.checkEntryExpiry(storeName, await IndexedDB.db.getAllKeys(storeName), options);
        }

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

    static delete(storeName, key) {

        const keys = IndexedDB._asArray(key);
        const dataStore = IndexedDB.db.transaction(storeName, "readwrite").store;
        let expiryStore;

        if (IndexedDB.cacheObjectStores.has(storeName)) {
            expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        }

        return Promise.all(keys.map(key => {
            const dataPromise = dataStore.delete(key);
            if (expiryStore) {
                return Promise.all([
                    dataPromise,
                    expiryStore.delete(IndexedDB.timestampedStores.has(storeName) ? storeName : `${storeName}_${key}`)
                ]);
            }
            return dataPromise;
        }));
    }

    static clear(storeName = Array.from(IndexedDB.cacheObjectStores.keys())) {
        const storeNames = IndexedDB._asArray(storeName);
        let expiryStore;

        if (storeNames.some(storeName => IndexedDB.cacheObjectStores.has(storeName))) {
            expiryStore = IndexedDB.db.transaction("expiries", "readwrite").store;
        }

        return Promise.all(storeNames.map(storeName => {
            const clearPromise = IndexedDB.db.clear(storeName);

            if (IndexedDB.cacheObjectStores.has(storeName)) {

                let expiryKey;
                if (IndexedDB.timestampedStores.has(storeName)) {
                    expiryKey = storeName;
                } else {
                    expiryKey = IDBKeyRange.bound(
                        `${storeName}_`,
                        `${storeName}${String.fromCharCode("_".charCodeAt(0) + 1)}`,
                        false,
                        true
                    );
                }

                return Promise.all([
                    clearPromise,
                    expiryStore.delete(expiryKey),
                ]);
            }

            return clearPromise;
        }));
    }

    static async contains(storeName, key, options = {}) {
        const keys = IndexedDB._asArray(key);

        await Promise.all([
            IndexedDB.checkStoreExpiry(storeName, options),
            IndexedDB.checkEntryExpiry(storeName, keys, options),
        ]);

        const store = IndexedDB.db.transaction(storeName).store;

        const values = await Promise.all(keys.map(key => store.openCursor(key)
            .then(cursor => Boolean(cursor))));

        return Array.isArray(key) ? IndexedDB._resultsAsObject(keys, values) : values[0];
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
        let expired = true;

        if (expiry) {
            expired = IndexedDB.isExpired(expiry);
        }

        if (expired) {
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
IndexedDB._promise = null;
IndexedDB._ongoingRequests = new Map();

/*
 *  Object stores in this map won't get checked
 *  for timestamps if cached.
 *  Instead of checking the single entry, the object store itself has
 *  a entry named "expiry".
 *
 *  This allows us to reduce the overhead of having one timestamp for
 *  each individual entry, although they're basically fetched during
 *  the same time.
 */
IndexedDB.timestampedStores = new Map([
    ["coupons", 60 * 60],
    ["giftsAndPasses", 60 * 60],
    ["items", 60 * 60],
    ["earlyAccessAppids", 60 * 60],
    ["purchases", 24 * 60 * 60],
    ["dynamicStore", 15 * 60],
    ["rates", 60 * 60],
    ["collection", 15 * 60],
    ["waitlist", 15 * 60],
]);

IndexedDB.timestampedEntriesStores = new Map([
    ["packages", 7 * 24 * 60 * 60],
    ["storePageData", 60 * 60],
    ["profiles", 24 * 60 * 60],
    ["workshopFileSizes", 5 * 24 * 60 * 60],
    ["reviews", 60 * 60],
]);

IndexedDB.cacheObjectStores = new Map([...IndexedDB.timestampedStores, ...IndexedDB.timestampedEntriesStores]);

export {IndexedDB};
