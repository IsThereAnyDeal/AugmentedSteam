import browser, {type Storage as ns} from "webextension-polyfill";
import Storage, {type StorageSchema} from "./Storage";
import type {TLogin} from "@Background/Modules/Community/_types";

interface CacheEntry<V = unknown> {
    data: V,
    expiry: number
}

interface LocalStorageSchema extends StorageSchema {
    login: TLogin,
    storeCountry: string,
    currency: CacheEntry<string>,
    access_token: {
        token: string,
        expiry: number
    },
    lastItadImport: {
        from: null|number,
        to: null|number
    }
}

class LocalStorage<Schema extends StorageSchema> extends Storage<ns.LocalStorageArea, Schema>{

    public constructor() {
        super(browser.storage.local);
    }
}

export default new LocalStorage<LocalStorageSchema>();

/* FIXME
const DEFAULTS = {
    "access_token": null,
    "lastItadImport": {"from": null, "to": null},
    "login": {"steamId": null, "profilePath": null},
    "storeCountry": null,
    "expand_slider": false,
    "es_guide_tags": {}, // TODO remove prefix
    "market_stats": {"startListing": null, "purchaseTotal": 0, "saleTotal": 0},
    "popular_refresh": false,
    "workshop_state": "",
    "playback_hd": false,
    "show_review_section": true,
    "steampeek": false,
    "support_info": null,
    "hide_login_warn_store": false,
    "hide_login_warn_community": false,
    "review_filters": {},
    "local_storage_migration": {"store": false, "community": false, "extension": false},
};

const PERSISTENT: (keyof typeof DEFAULTS)[] = [];
*/
