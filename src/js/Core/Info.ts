import browser from "webextension-polyfill";

export const Info = {
    "version": browser.runtime.getManifest().version,
    "db_version": 4,
} as const;
