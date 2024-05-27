import bootstrapDomPurify from "../bootstrapDomPurify";
import ContextMenu from "./Modules/ContextMenu/ContextMenu";
import IndexedDB from "@Background/Db/IndexedDB";
import SteamCommunityApi from "./Modules/Community/SteamCommunityApi";
import SteamStoreApi from "./Modules/Store/SteamStoreApi";
import ITADApi from "./Modules/IsThereAnyDeal/ITADApi";
import AugmentedSteamApi from "./Modules/AugmentedSteam/AugmentedSteamApi";
import UserNotesApi from "./Modules/UserNotes/UserNotesApi";
import browser, {type Runtime} from "webextension-polyfill";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import InventoryApi from "@Background/Modules/Inventory/InventoryApi";
import CacheApi from "@Background/Modules/Cache/CacheApi";
import {SettingsStore} from "@Options/Data/Settings";

type MessageSender = Runtime.MessageSender;

type Message = {
    action: string,
    params: any
};

browser.runtime.onMessage.addListener((
    message: Message,
    sender: MessageSender,
    sendResponse: (...params: any) => void
): true|undefined => {

    if (!sender || !sender.tab) { // not from a tab, ignore
        return;
    }
    if (!message || !message.action) {
        return;
    }

    (async function(): Promise<void> {
        try {
            await Promise.all([IndexedDB, SettingsStore, bootstrapDomPurify()]);

            let response: any = undefined;
            let handlers: MessageHandlerInterface[] = [
                new AugmentedSteamApi(),
                new SteamCommunityApi(),
                new InventoryApi(),
                new ITADApi(),
                new SteamStoreApi(),
                new UserNotesApi(),
                new CacheApi()
            ];

            for (let handler of handlers) {
                response = await handler.handle(message);
                if (response !== undefined) {
                    break;
                }
            }

            if (response === undefined) {
                throw new Error(`Did not recognize message`);
            }

            sendResponse(response);
        } catch (err) {
            console.group(`Callback: "${message.action}"`);
            console.error("Failed to execute %o", message);
            console.error(err);
            console.groupEnd();

            throw new Error((<Error>err).toString());
        }
    })();

    return true;
});

ContextMenu.register();
