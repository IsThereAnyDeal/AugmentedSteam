import browser, {type Storage as ns} from "webextension-polyfill";
import Storage, {type StorageSchema} from "./Storage";

// FIXME exports are confusing, figure out better export scheme

/**
 * NOTE: Settings are stored in synced storage, but are omitted from default schema,
 * because they should not be accessed directly from storage
 */
interface SyncedStorageSchema extends StorageSchema {
    user_notes: Record<string, string>,
    fav_emoticons: string[],
    sortfriendsby: string,
    sortgroupsby: string,
    sortmylistingsby: string,
    sortreviewsby: string,
    homepage_tab_last: string;
}

/*
 * browser.storage.sync limits
 * QUOTA_BYTES = 102400 // 100KB
 * QUOTA_BYTES_PER_ITEM = 8192 // 8KB
 * MAX_ITEMS = 512
 * MAX_WRITE_OPERATIONS_PER_HOUR = 1800
 * MAX_WRITE_OPERATIONS_PER_MINUTE = 120
 */
export class SyncedStorage<Schema extends StorageSchema> extends Storage<ns.SyncStorageAreaSync, Schema> {

    constructor() {
        super(browser.storage.sync);
    }

    get QUOTA_BYTES_PER_ITEM(): number {
        // see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/66696
        return browser.storage.sync.QUOTA_BYTES_PER_ITEM ?? 8192;
    }
}

export default new SyncedStorage<SyncedStorageSchema>();
