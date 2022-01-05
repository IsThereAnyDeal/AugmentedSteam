
import {Storage} from "./Storage";
import {Environment} from "../Environment";

class LocalStorage extends Storage {

    static async init() {
        await super.init();

        if (this === LocalStorage) {
            // TODO Remove after some versions
            return this.migrate();
        }
        return null;
    }

    static async migrate() {

        const migrationDone = this.get("local_storage_migration");

        let type;

        if (location.hostname === "store.steampowered.com") {
            type = "store";
        } else if (location.hostname === "steamcommunity.com") {
            type = "community";
        } else if (Environment.isContentScript()) {
            return null;
        } else {
            type = "extension";
        }

        if (migrationDone[type]) { return null; }

        await Promise.all(Object.keys(LocalStorage.defaults).map(async key => {

            let value = localStorage.getItem(key);
            if (value === null) { return; }

            try {
                value = JSON.parse(value);
            } catch (err) {
                console.error("Can't parse value", value);
                throw err;
            }

            await LocalStorage.set(key, value);
            localStorage.removeItem(key);
        }));

        migrationDone[type] = true;
        return LocalStorage.set("local_storage_migration", migrationDone);
    }
}

LocalStorage._adapter = browser.storage.local;

LocalStorage.defaults = Object.freeze({
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
});

export {LocalStorage};
