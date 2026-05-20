import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import ITADSyncMenu from "@Content/Modules/Widgets/ITADSync/ITADSyncMenu.svelte";
import type UserInterface from "@Core/User/UserInterface";
import ITADDisconnectModal from "@Content/Modules/Widgets/ITADSync/ITADDisconnectModal.svelte";
import Settings from "@Options/Data/Settings";

export default class ITAD {

    static async init(user: UserInterface) {

        if (Settings.itad_disconnect_popup && await ITADApiFacade.isExpired()) {
            await (new Promise<void>(resolve => {
                const modal = new ITADDisconnectModal({
                    target: document.body,
                    props: {
                        onclose: () => {
                            resolve();
                            modal.$destroy();
                        }
                    }
                });
            }))
        }

        if (!await ITADApiFacade.isConnected()) {
            return;
        }

        if (user.isSignedIn) {
            await ITADApiFacade.sync();
        }

        const menu = document.querySelector(".as-menu");
        if (menu) {
            (new ITADSyncMenu({
                target: menu.parentElement!,
                anchor: menu
            }));
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
