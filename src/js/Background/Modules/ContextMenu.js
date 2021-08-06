import {Localization} from "../../Core/Localization/Localization";
import {SyncedStorage} from "../../Core/Storage/SyncedStorage";
import {Permissions} from "../../modulesCore";

class ContextMenu {

    static onClick(info) {
        const url = ContextMenu.queryLinks[info.menuItemId];
        if (!url) { return; }

        let query = info.selectionText.trim();

        if (info.menuItemId === "context_steam_keys") {
            const steamKeys = query.match(/[A-Z0-9]{5}(-[A-Z0-9]{5}){2}/g);

            // Set the query to matched keys if any, otherwise display the selected text anyway
            if (Array.isArray(steamKeys)) {
                query = steamKeys.join(",");
            }
        }

        browser.tabs.create({"url": url.replace("__query__", encodeURIComponent(query))});
    }

    static async build() {
        await Localization;
        await SyncedStorage;

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

    static async update() {
        if (!await Permissions.contains(["contextMenus"])) { return null; }

        await browser.contextMenus.removeAll();
        return ContextMenu.build();
    }
}

ContextMenu.queryLinks = {
    "context_steam_store": "https://store.steampowered.com/search/?term=__query__",
    "context_steam_market": "https://steamcommunity.com/market/search?q=__query__",
    "context_itad": "https://isthereanydeal.com/search/?q=__query__",
    "context_bartervg": "https://barter.vg/search?q=__query__",
    "context_steamdb": "https://steamdb.info/search/?q=__query__",
    "context_steamdb_instant": "https://steamdb.info/instantsearch/?query=__query__",
    "context_steam_keys": "https://store.steampowered.com/account/registerkey?key=__query__"
};

export {ContextMenu};
