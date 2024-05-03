import {Feature} from "../../../Modules/Feature/Feature";

import CommunityAppPageLinks from "./CommunityAppPageLinks.svelte";
import Settings from "@Options/Data/Settings";

export default class FCommunityAppPageLinks extends Feature<{ appid: number }> {

    private node: HTMLElement | null = null;

    public override checkPrerequisites(): boolean {
        return (Settings.showsteamdb || Settings.showitadlinks || Settings.showbartervg)
            && (this.node = document.querySelector(".apphub_OtherSiteInfo")) !== null;
    }

    public override apply(): void {
        const node = this.node!;

        new CommunityAppPageLinks({
            "target": node,
            "props": {"appid": this.context.appid},
        });
    }
}
