import self_ from "./FCommunityAppPageLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import Settings from "@Options/Data/Settings";

export default class FCommunityAppPageLinks extends Feature<CApp> {

    private node: HTMLElement | null = null;

    public override checkPrerequisites(): boolean {
        return (Settings.showsteamdb || Settings.showitadlinks || Settings.showbartervg)
            && (this.node = document.querySelector(".apphub_OtherSiteInfo")) !== null
            && this.context.appid !== null;
    }

    public override apply(): void {
        const node = this.node!;
        (new self_({
            "target": node,
            "props": {
                appid: this.context.appid!
            },
        }));
    }
}
