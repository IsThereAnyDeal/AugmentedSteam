import {
    __options_contextBartervg,
    __options_contextItad,
    __options_contextSteamdb,
    __options_contextSteamdbInstant,
    __options_contextSteamKeys,
    __options_contextSteamMarket,
    __options_contextSteamStore,
} from "@Strings/_strings";
import Localization, {L} from "@Core/Localization/Localization";
import Settings, {SettingsStore} from "@Options/Data/Settings";
import browser, {type Menus} from "webextension-polyfill";
import Permissions from "@Core/Permissions";

export default class ContextMenu {

    private static readonly queryLinks: Record<string, [string, string, () => boolean]> = {
        "context_steam_store": [
            __options_contextSteamStore, "https://store.steampowered.com/search/?term=__query__",
            () => Settings.context_steam_store,
        ],
        "context_steam_market": [
            __options_contextSteamMarket, "https://steamcommunity.com/market/search?q=__query__",
            () => Settings.context_steam_market
        ],
        "context_itad": [
            __options_contextItad, "https://isthereanydeal.com/search/?q=__query__",
            () => Settings.context_itad
        ],
        "context_bartervg": [
            __options_contextBartervg, "https://barter.vg/search?q=__query__",
            () => Settings.context_bartervg
        ],
        "context_steamdb": [
            __options_contextSteamdb, "https://steamdb.info/search/?q=__query__",
            () => Settings.context_steamdb
        ],
        "context_steamdb_instant": [
            __options_contextSteamdbInstant, "https://steamdb.info/instantsearch/?query=__query__",
            () => Settings.context_steamdb_instant
        ],
        "context_steam_keys": [
            __options_contextSteamKeys, "https://store.steampowered.com/account/registerkey?key=__query__",
            () => Settings.context_steam_keys
        ]
    };

    static register(): Promise<void> {
        browser.runtime.onStartup.addListener(ContextMenu.update);
        browser.runtime.onInstalled.addListener(ContextMenu.update);

        // @ts-ignore
        return Permissions.when("contextMenus", () => {
            browser.contextMenus.onClicked.addListener(ContextMenu.onClick);
        }, async () => {
            browser.contextMenus.onClicked.removeListener(ContextMenu.onClick);
            await browser.contextMenus.removeAll();
        });

    }

    private static onClick(info: Menus.OnClickData): void {

        // @ts-ignore
        const url: string|undefined = ContextMenu.queryLinks[info.menuItemId][1];
        if (!url) {
            return;
        }

        let query = info.selectionText!.trim();

        if (info.menuItemId === "context_steam_keys") {
            const steamKeys = query.match(/[A-Z0-9]{5}(-[A-Z0-9]{5}){2}/g);

            // Set the query to matched keys if any, otherwise display the selected text anyway
            if (Array.isArray(steamKeys)) {
                query = steamKeys.join(",");
            }
        }

        browser.tabs.create({
            url: url.replace("__query__", encodeURIComponent(query))
        });
    }

    static async build(): Promise<void> {
        await SettingsStore;
        await Localization;

        for (const [option, entry] of Object.entries(ContextMenu.queryLinks)) {
            let [locale, query_, enabled] = entry;
            if (!enabled()) {
                continue
            }

            browser.contextMenus.create({
                id: option,
                title: L(locale, {"query": "%s"}),
                contexts: ["selection"]
            },

            /*
             * TODO don't recreate the context menu entries on each change, only update
             * the affected entry (which should also prevent this error)
             * Error when you create an entry with duplicate id
             */
            () => browser.runtime.lastError);
        }
    }

    public static async update(): Promise<void> {
        await SettingsStore;
        if (!await Permissions.contains(["contextMenus"])) {
            Settings.context_steam_store = false;
            Settings.context_steam_market = false
            Settings.context_itad = false
            Settings.context_bartervg = false
            Settings.context_steamdb = false
            Settings.context_steamdb_instant = false
            Settings.context_steam_keys = false
            return;
        }

        await browser.contextMenus.removeAll();
        return ContextMenu.build();
    }
}
