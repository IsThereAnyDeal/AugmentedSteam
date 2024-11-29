import self_ from "./FCommunityProfileLinks.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import HTML from "@Core/Html/Html";

export default class FCommunityProfileLinks extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return this.context.steamId !== null;
    }

    override apply(): void {

        const linksNode = document.querySelector(".profile_item_links");
        if (linksNode) {
            (new self_({
                target: linksNode,
                props: {
                    steamId: this.context.steamId!,
                    clear: true,
                    language: this.context.language?.name
                }
            }));
        } else {
            const rightColNode = document.querySelector(".profile_rightcol");
            HTML.beforeEnd(rightColNode, `<div class="profile_item_links"></div>`);
            HTML.afterEnd(rightColNode, '<div style="clear: both;"></div>');

            (new self_({
                target: document.querySelector(".profile_item_links")!,
                props: {
                    steamId: this.context.steamId!,
                    clear: false,
                    language: this.context.language?.name
                }
            }));
        }
    }
}
