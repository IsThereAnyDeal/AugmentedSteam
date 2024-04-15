import browser from "webextension-polyfill";
import {type Storage as ns} from "webextension-polyfill";
import Storage from "./Storage";

export class LocalStorage extends Storage<ns.LocalStorageArea>{

    public constructor() {
        super(browser.storage.local);
    }
}

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
