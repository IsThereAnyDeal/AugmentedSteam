import self_ from "./FSteamRep.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Settings from "@Options/Data/Settings";

export default class FSteamRep extends Feature<CProfileHome> {

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showsteamrepapi) {
            return false;
        }

        const result = await this.context.data;
        return result !== null && result.steamrep && result.steamrep.length > 0;
    }

    override async apply(): Promise<void> {

        const steamrep = ((await this.context.data)?.steamrep ?? [])
            .map(r => r.trim())
            .filter(r => r !== "");

        if (steamrep.length === 0) {
            return;
        }

        const target = document.querySelector<HTMLElement>(".profile_rightcol");
        if (target) {
            (new self_({
                target,
                anchor: target.firstElementChild ?? undefined,
                props: {
                    steamId: this.context.steamId!,
                    steamrep
                }
            }));
        }
    }
}
