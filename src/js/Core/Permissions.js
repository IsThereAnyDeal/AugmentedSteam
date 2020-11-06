import {SyncedStorage} from "./Storage/SyncedStorage";

const PermissionOptions = Object.freeze({
    "context_steam_store": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_steam_market": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_itad": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_bartervg": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_steamdb": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_steamdb_instant": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "context_steam_keys": {
        "persistent": true,
        "permissions": ["contextMenus"]
    },
    "itad_connect": {
        "persistent": false,
        "permissions": ["webRequest", "webRequestBlocking"],
    },
});

class Permissions {

    /**
     * @return Promise
     */
    static contains(permissionList) {
        return browser.permissions.contains({"permissions": permissionList});
    }

    /**
     * @return Promise
     */
    static request(permissionList) {
        return browser.permissions.request({"permissions": permissionList});
    }

    /**
     * @return Promise
     */
    static remove(permissionList) {
        if (permissionList.includes("contextMenus")) {
            browser.contextMenus.removeAll();
        }
        return browser.permissions.remove({"permissions": permissionList});
    }

    static async when(permission, onPermissionAtInit, onAdded, onRemoved) {
        if (onPermissionAtInit && await Permissions.contains([permission])) {
            onPermissionAtInit();
        }

        if (onAdded) {
            browser.permissions.onAdded.addListener(p => {
                if (p.permissions.includes(permission)) {
                    onAdded();
                }
            });
        }

        if (onRemoved) {
            browser.permissions.onRemoved.addListener(p => {
                if (p.permissions.includes(permission)) {
                    onRemoved();
                }
            });
        }
    }

    static requestOption(option) {
        return Permissions.request(PermissionOptions[option].permissions);
    }

    static removeOption(optionToRemove) {

        // If any of the permissions is in use by another option, don't remove.
        const unusedPermissions = Permissions._getUnusedPermissions(optionToRemove);
        if (unusedPermissions.length === 0) {
            return Promise.resolve(true);
        }

        return Permissions.remove(unusedPermissions);
    }

    static _getUnusedPermissions(option) {
        const used = new Set();
        for (const [key, setup] of Object.entries(PermissionOptions)) {
            if (option === key || (setup.persistent && !SyncedStorage.get(key))) {
                continue;
            }

            for (const p of setup.permissions) {
                used.add(p);
            }
        }

        const unused = new Set();
        for (const p of PermissionOptions[option].permissions) {
            if (!used.has(p)) {
                unused.add(p);
            }
        }

        return Array.from(unused.values());
    }
}

export {PermissionOptions, Permissions};
