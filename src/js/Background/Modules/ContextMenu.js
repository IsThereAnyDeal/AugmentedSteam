import {
    __options_contextBartervg,
    __options_contextItad, __options_contextSteamdb, __options_contextSteamdbInstant, __options_contextSteamKeys,
    __options_contextSteamMarket,
    __options_contextSteamStore,
} from "../../../localization/compiled/_strings";
import {L} from "../../Core/Localization/Localization";
import {Localization, Permissions, SyncedStorage} from "../../modulesCore";

class ContextMenu {

    static onClick(info) {
        const url = ContextMenu.queryLinks[info.menuItemId][1];
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
        await SyncedStorage;
        await Localization;

        for (const [option, entry] of Object.entries(ContextMenu.queryLinks)) {
            if (!SyncedStorage.get(option)) { continue; }

            browser.contextMenus.create({
                "id": option,
                "title": L(entry[0], {"query": "%s"}),
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
    "context_steam_store": [__options_contextSteamStore, "https://store.steampowered.com/search/?term=__query__"],
    "context_steam_market": [__options_contextSteamMarket, "https://steamcommunity.com/market/search?q=__query__"],
    "context_itad": [__options_contextItad, "https://isthereanydeal.com/search/?q=__query__"],
    "context_bartervg": [__options_contextBartervg, "https://barter.vg/search?q=__query__"],
    "context_steamdb": [__options_contextSteamdb, "https://steamdb.info/search/?q=__query__"],
    "context_steamdb_instant": [__options_contextSteamdbInstant, "https://steamdb.info/instantsearch/?query=__query__"],
    "context_steam_keys": [__options_contextSteamKeys, "https://store.steampowered.com/account/registerkey?key=__query__"]
};

export {ContextMenu};
