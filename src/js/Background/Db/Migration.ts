import type {IDBPDatabase, IDBPTransaction, StoreNames} from "idb";
import type {ADB5} from "@Background/Db/Schemas/ADB5";

type Schema = ADB5;

async function upgrade(
    db: IDBPDatabase<Schema>,
    oldVersion: number,
    _newVersion: number|null,
    _tx: IDBPTransaction<Schema, StoreNames<Schema>[], "versionchange">
) {
    if (oldVersion == 0) {
        db.createObjectStore("items");
        db.createObjectStore("collection");
        db.createObjectStore("waitlist");
        db.createObjectStore("itadImport");
        db.createObjectStore("purchases");
        db.createObjectStore("notes");
    }

    if (oldVersion >= 1) {
        db.deleteObjectStore("storePageData");
        db.deleteObjectStore("rates");
        db.deleteObjectStore("coupons");
        db.deleteObjectStore("giftsAndPasses");
        db.deleteObjectStore("dynamicStore");
        db.deleteObjectStore("packages");
    }

    if (oldVersion >= 2) {
        db.deleteObjectStore("workshopFileSizes");
        db.deleteObjectStore("reviews");
    }

    if (oldVersion >= 3) {
        db.deleteObjectStore("expiries");
    }

    if (oldVersion >= 4) {
        db.deleteObjectStore("storeList");
    }

    db.createObjectStore("storePageData")
        .createIndex("idx_expiry", "expiry");

    db.createObjectStore("rates")
        .createIndex("idx_expiry", "expiry");

    db.createObjectStore("coupons")
        .createIndex("idx_appid", "appids", {unique: false, multiEntry: true});

    db.createObjectStore("giftsAndPasses")
        .createIndex("idx_appid", "", {unique: false, multiEntry: true});

    db.createObjectStore("dynamicStore")
        .createIndex("idx_appid", "", {unique: false, multiEntry: true});

    db.createObjectStore("packages")
        .createIndex("idx_expiry", "expiry");

    db.createObjectStore("workshopFileSizes")
        .createIndex("idx_expiry", "expiry");

    db.createObjectStore("reviews")
        .createIndex("idx_expiry", "expiry");

    db.createObjectStore("expiries")
        .createIndex("idx_expiry", "");

    db.createObjectStore("storeList", {keyPath: "id"});
}

export default {upgrade};
