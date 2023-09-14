import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

import CommunityAppPageLinks from "./CommunityAppPageLinks.svelte";

export default class FCommunityAppPageLinks extends Feature<{ appid: number }> {

    private node: HTMLElement | null = null;

    public override checkPrerequisites(): boolean {
        return (SyncedStorage.get("showsteamdb") || SyncedStorage.get("showitadlinks") || SyncedStorage.get("showbartervg"))
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
