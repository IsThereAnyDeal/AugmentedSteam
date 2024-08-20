import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import CommonExtraLinks from "@Content/Features/Common/CommonExtraLinks.svelte";

export default class FCommunityAppPageLinks extends Feature<CApp> {

    private node: HTMLElement | null = null;

    override checkPrerequisites(): boolean {
        return (this.node = document.querySelector(".apphub_OtherSiteInfo")) !== null
            && this.context.appid !== null;
    }

    override apply(): void {

        (new CommonExtraLinks({
            "target": this.node!,
            "props": {
                type: "app",
                gameid: this.context.appid!,
                isCommunity: true
            },
        }));
    }
}
