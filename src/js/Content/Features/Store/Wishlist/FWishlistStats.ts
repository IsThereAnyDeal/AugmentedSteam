import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import WishlistStats from "@Content/Features/Store/Wishlist/Components/WishlistStats.svelte";
import Language from "@Core/Localization/Language";
import WishlistButton from "@Content/Features/Store/Wishlist/Components/WishlistButton.svelte";
import {__wl_label} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import {getMenuNode} from "@Content/Features/Store/Wishlist/Components/WishlistMenu";
import { mount } from "svelte";

export default class FWishlistStats extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return Settings.showwishliststats;
    }

    override async apply(): Promise<void> {

        mount(WishlistStats, {
                target: document.body,
                props: {
                    user: this.context.user,
                    language: this.context.language ?? new Language("english"),
                    wishlistData: this.context.wishlistData ?? [],
                    canEdit: this.context.user.steamId === this.context.ownerId
                }
            });

        mount(WishlistButton, {
                target: getMenuNode().getTarget(3),
                props: {
                    label: L(__wl_label),
                    onclick: () => {
                        document.dispatchEvent(new CustomEvent("as:openStats"))
                    }
                }
            });
    }
}
