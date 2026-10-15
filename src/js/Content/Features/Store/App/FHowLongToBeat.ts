import self_ from "./FHowLongToBeat.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";

export default class FHowLongToBeat extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.showhltb
            && !this.context.isDlcLike
            && !this.context.isVideoOrHardware;
    }

    override async apply(): Promise<void> {
        const hltb = (await this.context.data)?.hltb;
        if (!hltb) {
            return;
        }

        const anchor = document.querySelector("div.game_details")!.nextElementSibling!;
        mount(self_, {
            target: anchor.parentElement!,
            anchor,
            props: {
                story: hltb.story,
                extras: hltb.extras,
                complete: hltb.complete,
                url: hltb.url
            }
        });
    }
}
