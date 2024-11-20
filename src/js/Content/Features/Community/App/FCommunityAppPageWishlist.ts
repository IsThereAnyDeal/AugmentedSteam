import self_ from "./FCommunityAppPageWishlist.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Community/App/CApp";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import Settings from "@Options/Data/Settings";

export default class FCommunityAppPageWishlist extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn
            && Settings.wlbuttoncommunityapp
            && document.querySelector(".apphub_OtherSiteInfo") !== null;
    }

    override async apply(): Promise<void> {
        const appid = this.context.appid;
        if (!appid) {
            return;
        }

        const {owned, wishlisted} = await DynamicStore.getAppStatus(`app/${appid}`);
        if (owned) { return; }

        const target = document.querySelector(".apphub_OtherSiteInfo");
        if (!target) {
            return;
        }

        (new self_({
            target,
            props: {appid, wishlisted}
        }));
    }
}
