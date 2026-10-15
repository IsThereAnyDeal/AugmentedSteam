import self_ from "./FFamilySharingNotice.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";

export default class FFamilySharingNotice extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.exfgls;
    }

    override async apply(): Promise<void> {
        const comingSoonNode = document.querySelector(".game_area_comingsoon");
        if (comingSoonNode) { // TODO temporary fix, return reason from server
            return;
        }

        const familySharing = (await this.context.data)?.family_sharing;
        if (!familySharing) {
            return;
        }

        const anchor = document.querySelector("#game_area_purchase");
        if (!anchor) {
            throw new Error("Node not found");
        }

        (mount(self_, {
            target: anchor.parentElement!,
            anchor,
        }));
    }
}
