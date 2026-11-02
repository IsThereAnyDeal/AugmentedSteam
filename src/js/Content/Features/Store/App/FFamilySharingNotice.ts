import self_ from "./FFamilySharingNotice.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FFamilySharingNotice extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return Settings.exfgls;
    }

    override async apply(): Promise<string|null> {
        const comingSoonNode = document.querySelector(".game_area_comingsoon");
        if (comingSoonNode) { // TODO temporary fix, return reason from server
            return null;
        }

        const familySharing = (await this.context.data)?.family_sharing;
        if (!familySharing) {
            return null;
        }

        const anchor = document.querySelector("#game_area_purchase");
        if (!anchor) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: anchor.parentElement!,
            anchor,
        });
        return null;
    }
}
