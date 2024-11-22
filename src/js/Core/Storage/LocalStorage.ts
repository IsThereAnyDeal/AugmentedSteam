import browser, {type Storage as ns} from "webextension-polyfill";
import Storage, {type StorageSchema} from "./Storage";
import type {TLogin} from "@Background/Modules/Community/_types";

// FIXME exports are confusing, figure out better export scheme

interface CacheEntry<V = unknown> {
    data: V,
    expiry: number
}

export interface LocalStorageSchema extends StorageSchema {
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
    },
    syncEvents: Array<{
        section: string,
        type: "push"|"pull",
        timestamp: number,
        count: number
    }>,
    db_cleanup: number,
    show_review_section: boolean,
    hide_login_warn_store: boolean,
    hide_login_warn_community: boolean,
    guide_tags: string[],
    market_stats: {
        startListing: string|null,
        purchaseTotal: number,
        saleTotal: number
    },
    popular_refresh: boolean,
    expand_slider: boolean,
    workshop_state: string,
    playback_hd: boolean,
    steampeek: boolean,
    support_info: {
        data: any, // TODO fix type
        expiry: number
    },
    review_filters: {
        context?: string,
        language?: string,
        minPlaytime?: string,
        maxPlaytime?: string
    },
    cachedUser?: string
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
