import self_ from "./FHowLongToBeat.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
import Settings from "@Options/Data/Settings";

export default class FHowLongToBeat extends Feature<CApp> {

    private hltb: TStorePageData['hltb']|null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (!Settings.showhltb || this.context.isDlcLike || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.hltb) {
            return false;
        }

        this.hltb = result.hltb;
        return true;
    }

    apply() {
        if (!this.hltb) { return }

        const anchor = document.querySelector("div.game_details")!.nextElementSibling!;
        new self_({
            target: anchor.parentElement!,
            anchor,
            props: {
                story: this.hltb.story,
                extras: this.hltb.extras,
                complete: this.hltb.complete,
                url: this.hltb.url
            }
        })
    }
}
