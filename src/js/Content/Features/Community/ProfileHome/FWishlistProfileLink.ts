import self_ from "./FWishlistProfileLink.svelte";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";

export default class FWishlistProfileLink extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return !this.context.isPrivateProfile
            && this.context.steamId !== null
            && Settings.show_wishlist_link;
    }

    override async apply(): Promise<void> {

        const node = document.querySelector(".profile_item_links .profile_count_link")!;
        new self_({
            target: node.parentElement!,
            anchor: node.nextElementSibling!,
            props: {
                steamid: this.context.steamId!
            }
        });
    }
}
