import Feature from "@Content/Modules/Context/Feature";
import type CProfileActivity from "@Content/Features/Community/ProfileActivity/CProfileActivity";
import Settings from "@Options/Data/Settings";

export default class FReplaceCommunityHubLinks extends Feature<CProfileActivity> {

    override checkPrerequisites(): boolean {
        return Settings.replacecommunityhublinks;
    }

    override apply(): void{
        this.callback();
        this.context.onContent.subscribe(e => this.callback(e.data))
    }

    callback(parent: HTMLElement|Document = document) {

        const excluded = [
            ".bb_link", // User-provided links, i.e. links in announcements/comments
            "[href*='/announcements/detail/']", // Announcement header links
        ].join(",");

        const nodes = parent.querySelectorAll<HTMLAnchorElement>(`.blotter_block a[href]:not(${excluded})`);

        for (const node of nodes) {
            node.href = node.href.replace(/steamcommunity\.com\/(?:app|games)/, "store.steampowered.com/app");
        }
    }
}
