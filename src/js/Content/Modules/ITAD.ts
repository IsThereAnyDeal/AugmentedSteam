import User from "@Content/Modules/User";
import Settings from "@Options/Data/Settings";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import ITADSyncStatus from "@Content/Modules/Widgets/ITADSyncStatus.svelte";

export default class ITAD {
    static async init() {
        if (!await ITADApiFacade.isConnected()) {
            return;
        }

        const target = document.querySelector("#global_action_menu");
        if (target) {
            const anchor = target.firstElementChild ?? undefined;
            (new ITADSyncStatus({target, anchor}));
        }

        if (User.isSignedIn && (Settings.itad_import_library || Settings.itad_import_wishlist)) {
            await ITADApiFacade.sync();
        }
    }

    static async getInCollection(storeIds: string[]): Promise<Set<string>> {
        const result = new Set<string>();
        if (await ITADApiFacade.isConnected()) {
            const map = await ITADApiFacade.inCollection(storeIds);
            for (let [steamId, value] of Object.entries(map)) {
                if (value) {
                    result.add(steamId);
                }
            }
        }
        return result;
    }

    static async getInWaitlist(storeIds: string[]): Promise<Set<string>> {
        const result = new Set<string>();
        if (await ITADApiFacade.isConnected()) {
            const map = await ITADApiFacade.inWaitlist(storeIds);
            for (let [steamId, value] of Object.entries(map)) {
                if (value) {
                    result.add(steamId);
                }
            }
        }
        return result;
    }
}
