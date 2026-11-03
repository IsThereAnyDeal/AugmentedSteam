import Feature from "@Content/Modules/Context/Feature";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";
import CommonExtraLinks from "@Content/Features/Common/CommonExtraLinks.svelte";
import {mount} from "svelte";
import Settings from "@Options/Data/Settings";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FExtraLinksBundle extends Feature<CBundle> {

    // FIXME refactor links to be fully dynamic, without predefined ones

    override async isEnabled(): Promise<boolean> {
        return Settings.showitadlinks
            || Settings.showsteamdb;
    }

    override async apply(): Promise<string|null> {

        const target: HTMLElement|null = document.querySelector(".share, .rightcol .game_details");
        if (!target) {
            throw new MountTargetError();
        }

        mount(CommonExtraLinks, {
            target,
            anchor: target.firstElementChild!,
            props: {
                type: "bundle",
                gameid: this.context.bundleid
            }
        });
        return null;
    }
}
