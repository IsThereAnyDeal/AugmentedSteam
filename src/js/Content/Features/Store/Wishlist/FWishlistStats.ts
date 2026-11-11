import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import WishlistStatsModal from "@Content/Features/Store/Wishlist/Components/WishlistStatsModal.svelte";
import Language from "@Core/Localization/Language";
import WishlistButton from "@Content/Features/Store/Wishlist/Components/WishlistButton.svelte";
import {__wl_label} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import {getMenuNode} from "@Content/Features/Store/Wishlist/Components/WishlistMenu";
import {mount, unmount} from "svelte";
import WishlistStats from "@Content/Features/Store/Wishlist/Components/WishlistStats.svelte";

export default class FWishlistStats extends Feature<CWishlist> {

    #stats: WishlistStats|undefined;

    override async isEnabled(): Promise<boolean> {
        return Settings.showwishliststats;
    }

    override async apply(): Promise<string|null> {

        mount(WishlistButton, {
            target: await getMenuNode().getTarget(3),
            props: {
                label: L(__wl_label),
                onclick: () => this.#openStats()
            }
        });
        return null;
    }

    #openStats(): void {
        this.#stats ??= new WishlistStats(
            this.context.wishlistData,
            this.context.user,
            this.context.language ?? Language.default
        );

        const modal = mount(WishlistStatsModal, {
            target: document.body,
            props: {
                user: this.context.user,
                stats: this.#stats,
                canEdit: this.context.user.steamId === this.context.ownerId,
                onclose: () => unmount(modal)
            }
        });
    }
}
