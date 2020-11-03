import {SyncedStorage} from "./Storage/SyncedStorage";

class Permissions {

    static isInUse(key) {
        for (const [option, optionPermissions] of Object.entries(this.options)) {
            if (option === key || (key.startsWith("opt_") && !SyncedStorage.get(key.substring(4)))) {
                continue;
            }

            if (optionPermissions.filter(permission => this.options[key].includes(permission)).length > 0) {
                return true;
            }
        }
        return false;
    }

    static contains(key) {
        return browser.permissions.contains({"permissions": this.options[key]});
    }

    static containsKey(key) {
        return key in this.options;
    }

    static request(key) {
        return browser.permissions.request({"permissions": this.options[key]});
    }

    static remove(key) {

        // If any of the permissions is in use by another option, don't remove.
        if (this.isInUse(key)) {
            return Promise.resolve(true);
        }

        return browser.permissions.remove({"permissions": this.options[key]});
    }
}

// TODO We should use "enum" like class for defining options - for easier tracking in code and avoiding typos

Permissions.options = Object.freeze({
    "opt_context_steam_store":      ["contextMenus"],
    "opt_context_steam_market":     ["contextMenus"],
    "opt_context_itad":             ["contextMenus"],
    "opt_context_bartervg":         ["contextMenus"],
    "opt_context_steamdb":          ["contextMenus"],
    "opt_context_steamdb_instant":  ["contextMenus"],
    "opt_context_steam_keys":       ["contextMenus"],
    "itad_connect":                 ["webRequest", "webRequestBlocking"],
});


export {Permissions};
