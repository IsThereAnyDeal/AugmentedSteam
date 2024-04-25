import browser, {type Storage as ns} from "webextension-polyfill";
import Storage, {type StorageSchema} from "./Storage";

// FIXME browser.storage.sync is still restricted (in terms of quota limits) even if the user hasn't enabled sync

/*
 * browser.storage.sync limits
 * QUOTA_BYTES = 102400 // 100KB
 * QUOTA_BYTES_PER_ITEM = 8192 // 8KB
 * MAX_ITEMS = 512
 * MAX_WRITE_OPERATIONS_PER_HOUR = 1800
 * MAX_WRITE_OPERATIONS_PER_MINUTE = 120
 */
export default class SyncedStorage<Schema extends StorageSchema> extends Storage<ns.SyncStorageAreaSync, Schema> {

    constructor() {
        super(browser.storage.sync);
    }

    get QUOTE_BYTES_PER_ITEM(): number {
        return browser.storage.sync.QUOTA_BYTES_PER_ITEM;
    }
}

