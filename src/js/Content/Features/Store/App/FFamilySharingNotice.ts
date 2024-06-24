import self_ from "./FFamilySharingNotice.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";

export default class FFamilySharingNotice extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.exfgls) { return false; }

        const result = await this.context.data;
        // Apply this feature if app is NOT family shareable
        return result !== null && !result.family_sharing;
    }

    override apply(): void {
        let anchor = document.querySelector("#game_area_purchase");
        if (!anchor) {
            throw new Error("Node not found");
        }

        (new self_({
            target: anchor.parentElement!,
            anchor,
        }));
    }
}
