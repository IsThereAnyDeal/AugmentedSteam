import type {DBSchema, IDBPDatabase, IDBPTransaction, StoreNames} from "idb";
import type {ADB5} from "@Background/Modules/Db/Schemas/ADB5";

type Schema = ADB5;

async function upgrade(
    db: IDBPDatabase<Schema>,
    oldVersion: number,
    _newVersion: number|null,
    tx: IDBPTransaction<Schema, StoreNames<Schema>[], "versionchange">
) {
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

    if (oldVersion < 4) {
        db.createObjectStore("storeList", {"keyPath": "id"});
    }

    if (oldVersion < 5) {
        const v4Db = db as unknown as IDBPDatabase;

        db.deleteObjectStore("storePageData");
        db.createObjectStore("storePageData")
            .createIndex("idx_expiry", "expiry");

        db.deleteObjectStore("rates");
        db.createObjectStore("rates")
            .createIndex("idx_expiry", "expiry");

        db.deleteObjectStore("coupons");
        db.createObjectStore("coupons")
            .createIndex("idx_appid", "appids", {unique: false, multiEntry: true});

        db.createObjectStore("giftsAndPasses")
            .createIndex("idx_appid", "", {unique: false, multiEntry: true});

        // db.deleteObjectStore("items");
        // db.createObjectStore("items");

        db.deleteObjectStore("workshopFileSizes");
        db.createObjectStore("workshopFileSizes")
            .createIndex("idx_expiry", "expiry");

        db.deleteObjectStore("reviews");
        db.createObjectStore("reviews")
            .createIndex("idx_expiry", "expiry");

        db.deleteObjectStore("storeList");
        db.createObjectStore("storeList", {keyPath: "id"});

        // db.deleteObjectStore("collection");
        // db.createObjectStore("collection");

        // db.deleteObjectStore("waitlist");
        // db.createObjectStore("waitlist");

        // db.deleteObjectStore("itadImport");
        // db.createObjectStore("itadImport");

        db.deleteObjectStore("dynamicStore");
        db.createObjectStore("dynamicStore");

        const v4Tx = tx as unknown as IDBPTransaction;

        let newData: Array<[StoreNames<ASDB>, {key: string|null, expiry: number}]> = [];

        let cursor = await v4Tx.objectStore("expiries").openCursor();
        while (cursor) {
            const parts = (cursor.key as unknown as string).split("_", 2) as [string, string|undefined];

            const storeName = parts[0];
            const key = parts[1] ?? null;
            const expiry = cursor.value;

            if (v4Db.objectStoreNames.contains(storeName)) {
                newData.push([storeName as StoreNames<ASDB>, {key, expiry}]);
            }

            cursor = await cursor.continue();
        }

        let expiries = v4Tx.objectStore("expiries");
        // @ts-ignore
        await expiries.clear();

        expiries.deleteIndex("expiry");

        tx.objectStore("expiries").createIndex("expiry", "expiry");

        for (let [key, value] of newData) {
            await tx.objectStore("expiries").put(value, key);
        }
    }
}

export default {upgrade};
