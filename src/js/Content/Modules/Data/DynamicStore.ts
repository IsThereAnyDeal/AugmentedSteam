import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import DOMHelper from "@Content/Modules/DOMHelper";
import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
import Messenger from "@Content/Modules/Messaging/Messenger";

export default class DynamicStore {

    private static registered: boolean = false;
    private static readyPromise: Promise<void>;

    private static register(): void {
        if (this.registered) {
            return;
        }
        DOMHelper.insertScript("scriptlets/DynamicStoreScriptlet.js");
        this.registered = true;
    }

    static onReady(): Promise<void> {
        if (!this.readyPromise) {
            this.readyPromise = new Promise(resolve => {
                this.register();
                window.addEventListener("DSReady", () => resolve(), {once: true});
                Messenger.call(MessageHandler.DynamicStore, "onReady");
            });
        }
        return this.readyPromise;
    }

    static invalidateCacheHandler(): void {
        this.register();
        window.addEventListener("DSInvalidateCache", () => this.clear());
        Messenger.call(MessageHandler.DynamicStore, "invalidateCache");
    }

    static clear(): Promise<void> {
        return SteamStoreApiFacade.clearDynamicStore();
    }

    static async getAppsStatus(storeIds: string[]): Promise<{
        ignored: Set<string>,
        ignoredOwned: Set<string>,
        owned: Set<string>,
        wishlisted: Set<string>
    }> {
        const dsStatus = await SteamStoreApiFacade.getDynamicStoreStatus(storeIds);
        return {
            ignored: new Set(dsStatus.ignored),
            ignoredOwned: new Set(dsStatus.ignoredOwned),
            owned: new Set(dsStatus.owned),
            wishlisted: new Set(dsStatus.wishlisted),
        }
    }

    static async getAppStatus(storeId: string): Promise<{
        ignored: boolean,
        ignoredOwned: boolean,
        owned: boolean,
        wishlisted: boolean
    }> {
        const dsStatus = await SteamStoreApiFacade.getDynamicStoreStatus([storeId]);
        return {
            ignored: dsStatus.ignored.length > 0,
            ignoredOwned: dsStatus.ignoredOwned.length > 0,
            owned: dsStatus.owned.length > 0,
            wishlisted: dsStatus.wishlisted.length > 0,
        }
    }

    static getRandomApp(): Promise<number|null> {
        return SteamStoreApiFacade.getDynamicStoreRandomApp();
    }
}
