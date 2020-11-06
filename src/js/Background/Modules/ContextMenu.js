import {Localization} from "../../Core/Localization/Localization";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Permissions} from "../../modulesCore";

class ContextMenu {

    static onClick(info) {
        const query = encodeURIComponent(info.selectionText.trim());
        const url = ContextMenu.queryLinks[info.menuItemId];
        if (!url) { return; }

        if (info.menuItemId === "context_steam_keys") {
            const steamKeys = query.match(/[A-Z0-9]{5}(-[A-Z0-9]{5}){2}/g);
            if (!steamKeys || steamKeys.length === 0) {

                // eslint-disable-next-line no-alert -- TODO Find a better way
                window.alert(Localization.str.options.no_keys_found);
                return;
            }

            for (const steamKey of steamKeys) {
                browser.tabs.create({"url": url.replace("__steamkey__", steamKey)});
            }
        } else {
            browser.tabs.create({"url": url.replace("__query__", query)});
        }
    }

    static async build() {
        await Localization;

        for (const option of Object.keys(ContextMenu.queryLinks)) {
            if (!SyncedStorage.get(option)) { continue; }

            browser.contextMenus.create({
                "id": option,
                "title": Localization.str.options[option].replace("__query__", "%s"),
                "contexts": ["selection"]
            },

            /*
             * TODO don't recreate the context menu entries on each change, only update
             * the affected entry (which should also prevent this error)
             * Error when you create an entry with duplicate id
             */
            () => chrome.runtime.lastError);
        }
    }

    static update() {
        Permissions.contains(["contextMenus"]).then(resolve => {
            if (resolve) {
                browser.contextMenus.removeAll().then(ContextMenu.build);
            }
        });
    }
}

ContextMenu.queryLinks = {
    "context_steam_store": "https://store.steampowered.com/search/?term=__query__",
    "context_steam_market": "https://steamcommunity.com/market/search?q=__query__",
    "context_itad": "https://isthereanydeal.com/search/?q=__query__",
    "context_bartervg": "https://barter.vg/search?q=__query__",
    "context_steamdb": "https://steamdb.info/search/?q=__query__",
    "context_steamdb_instant": "https://steamdb.info/instantsearch/?query=__query__",
    "context_steam_keys": "https://store.steampowered.com/account/registerkey?key=__steamkey__"
};

browser.storage.onChanged.addListener(changes => {
    if (Object.keys(changes).some(key => key.startsWith("context_"))) {
        ContextMenu.update();
    }
});

export {ContextMenu};
