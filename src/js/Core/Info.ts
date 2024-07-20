import browser from "webextension-polyfill";

export default {
    "version": browser.runtime.getManifest().version,
    "db_version": 5,
} as const;
