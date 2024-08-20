import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import CommonLinks from "@Content/Features/Store/Common/ExtraLinks/CommonLinks.svelte";

export default class FCommunityAppPageLinks extends Feature<CApp> {

    private node: HTMLElement | null = null;

    override checkPrerequisites(): boolean {
        return (this.node = document.querySelector(".apphub_OtherSiteInfo")) !== null
            && this.context.appid !== null;
    }

    override apply(): void {

        (new CommonLinks({
            "target": this.node!,
            "props": {
                type: "app",
                gameid: this.context.appid!,
                isCommunity: true,
            },
        }));
    }
}
