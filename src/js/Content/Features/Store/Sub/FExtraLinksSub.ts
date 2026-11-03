import Feature from "@Content/Modules/Context/Feature";
import CommonExtraLinks from "@Content/Features/Common/CommonExtraLinks.svelte";
import type CSub from "@Content/Features/Store/Sub/CSub";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";
import Settings from "@Options/Data/Settings";

export default class FExtraLinksSub extends Feature<CSub> {

    // FIXME refactor links to be fully dynamic, without predefined ones

    override async isEnabled(): Promise<boolean> {
        return Settings.showitadlinks
            || Settings.showsteamdb;
    }

    override async apply(): Promise<string|null> {

        const target: HTMLElement|null = document.querySelector(".rightcol.game_meta_data");
        if (!target) {
            throw new MountTargetError();
        }

        mount(CommonExtraLinks, {
            target,
            anchor: target.firstElementChild!,
            props: {
                type: "sub",
                gameid: this.context.subid
            }
        });
        return null;
    }
}
