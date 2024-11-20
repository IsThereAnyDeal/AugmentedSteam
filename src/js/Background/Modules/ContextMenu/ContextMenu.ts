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
import type {SettingsSchema} from "@Options/Data/_types";

export type ContextMenuKeys = keyof SettingsSchema & (
      "context_steam_store"
    | "context_steam_market"
    | "context_itad"
    | "context_bartervg"
    | "context_steamdb"
    | "context_steamdb_instant"
    | "context_steam_keys"
);

export default class ContextMenu {

    private static readonly queryLinks: Record<ContextMenuKeys, [string, string, () => boolean]> = {
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

    static register(): void {
        browser.runtime.onStartup.addListener(ContextMenu.build);
        browser.runtime.onInstalled.addListener(ContextMenu.build);

        if (!browser.contextMenus.onClicked.hasListener(ContextMenu.onClick)) {
            browser.contextMenus.onClicked.addListener(ContextMenu.onClick);
        }
    }

    private static onClick(info: Menus.OnClickData): void {

        const menuItem = ContextMenu.queryLinks[info.menuItemId as ContextMenuKeys];
        if (!menuItem) {
            return;
        }

        const url: string = menuItem[1];
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
        await SettingsStore.init();
        await Localization.init(null);

        for (const [id, menuItem] of Object.entries(ContextMenu.queryLinks)) {
            const [locale, query_, enabled] = menuItem;

            browser.contextMenus.create({
                id,
                title: L(locale, {"query": "%s"}),
                contexts: ["selection"],
                visible: enabled()
            },

            () => browser.runtime.lastError);
        }
    }

    public static update(id: ContextMenuKeys): void {
        const menuItem = this.queryLinks[id];
        if (!menuItem) {
            return;
        }
        const [locale, query_, enabled] = menuItem;

        browser.contextMenus.update(id, {
            title: L(locale, {"query": "%s"}),
            contexts: ["selection"],
            visible: enabled()
        });
    }
}
