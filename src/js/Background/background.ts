import ContextMenu from "./Modules/ContextMenu/ContextMenu";
import IndexedDB from "@Background/Db/IndexedDB";
import SteamCommunityApi from "./Modules/Community/SteamCommunityApi";
import SteamStoreApi from "./Modules/Store/SteamStoreApi";
import ITADApi from "./Modules/IsThereAnyDeal/ITADApi";
import AugmentedSteamApi from "./Modules/AugmentedSteam/AugmentedSteamApi";
import UserNotesApi from "./Modules/UserNotes/UserNotesApi";
import browser, {type Runtime, type Storage as ns} from "webextension-polyfill";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import InventoryApi from "@Background/Modules/Inventory/InventoryApi";
import CacheApi from "@Background/Modules/Cache/CacheApi";
import {SettingsStore} from "@Options/Data/Settings";
import Environment, {ContextType} from "@Core/Environment";
import SettingsMigration from "@Core/Update/SettingsMigration";
import Version from "@Core/Version";
import {EAction} from "@Background/EAction";
import Storage from "@Core/Storage/Storage";
import WebRequestHandler from "@Background/Modules/WebRequest/WebRequestHandler";

Environment.CurrentContext = ContextType.Background;

type MessageSender = Runtime.MessageSender;

type Message = {
    action: string,
    params: any
};

export const Unrecognized = Symbol("Unrecognized");

browser.runtime.onInstalled.addListener(async (detail) => {
    if (detail.reason !== "update" || detail.previousVersion === undefined) {
        return;
    }

    const oldVersion = Version.fromString(detail.previousVersion);

    await IndexedDB.init();
    await SettingsMigration.migrate(oldVersion);
    await (new CacheApi()).handle(EAction.CacheClear);

    /*
     * Local storage migration
     * TODO remove in next minor version
     */
    await (async function() {
        const localStorage = new Storage<ns.LocalStorageArea, {es_guide_tags: Record<string, string[]>}>(browser.storage.local);
        await localStorage.remove("es_guide_tags");
    })();

    console.log("Update done");
});


const messageHandlers: MessageHandlerInterface[] = [
    new AugmentedSteamApi(),
    new SteamCommunityApi(),
    new InventoryApi(),
    new ITADApi(),
    new SteamStoreApi(),
    new UserNotesApi(),
    new CacheApi(),
    new WebRequestHandler()
];

browser.runtime.onMessage.addListener((
    message: Message,
    sender: MessageSender
): undefined|Promise<any> => {

    if (!sender || !sender.tab) { // not from a tab, ignore
        return;
    }
    if (!message || !message.action) {
        return;
    }

    return (async () => {
        try {
            await Promise.all([IndexedDB.init(), SettingsStore.init()]);

            let response: any = undefined;
            for (const handler of messageHandlers) {
                response = await handler.handle(message, sender.tab);
                if (response !== Unrecognized) {
                    break;
                }
            }

            if (response === Unrecognized) {
                throw new Error("Unknown message");
            }

            return response;
        } catch (err) {
            console.group(`Callback: "${message.action}"`);
            console.error("Failed to execute %o", message);
            console.error(err);
            console.groupEnd();

            throw new Error((<Error>err).toString());
        }
    })();
});

ContextMenu.register();
