import {type Key, default as Storage, type Value} from "./Storage";
import {Environment} from "../Environment";
import browser from "webextension-polyfill";

type MigrationArea = "community" | "extension" | "store";
type MigrationStatus = {
    [Area in MigrationArea]: boolean;
};

export class LocalStorage<Defaults extends Record<Key, Value>> extends Storage<Defaults> {

    public constructor(
        defaults: Defaults,
        persistent: (Extract<keyof Defaults, string>)[],
    ) {
        super(
            browser.storage.local,
            defaults,
            persistent,
        );
    }

    // TODO Remove after some versions
    protected override async migrate(): Promise<void> {

        const migrationDone = this.get("local_storage_migration") as MigrationStatus;

        let type: MigrationArea;

        if (location.hostname === "store.steampowered.com") {
            type = "store";
        } else if (location.hostname === "steamcommunity.com") {
            type = "community";
        } else if (Environment.isContentScript()) {
            return;
        } else {
            type = "extension";
        }

        if (migrationDone[type]) { return; }

        await Promise.all(Object.keys(this.defaults).map(async key => {

            const value = localStorage.getItem(key.toString());
            if (value === null) { return; }

            let parsed: unknown;
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                console.error("Can't parse value", value);
                throw err as SyntaxError;
            }

            await this.set(key, parsed);
            localStorage.removeItem(key.toString());
        }));

        migrationDone[type] = true;
        await this.set("local_storage_migration", migrationDone);
    }
}

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

export default new LocalStorage(
    DEFAULTS,
    PERSISTENT,
);
