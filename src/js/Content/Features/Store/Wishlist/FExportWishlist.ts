import {L} from "@Core/Localization/Localization";
import {__export_wishlist,} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import ExportWishlistForm from "@Content/Features/Store/Wishlist/Components/ExportWishlistForm.svelte";
import Language from "@Core/Localization/Language";
import WishlistButton from "@Content/Features/Store/Wishlist/Components/WishlistButton.svelte";
import {getMenuNode} from "@Content/Features/Store/Wishlist/Components/WishlistMenu";
import {mount, unmount} from "svelte";

export default class FExportWishlist extends Feature<CWishlist> {

    override async isEnabled(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<string|null> {
        mount(WishlistButton, {
            target: await getMenuNode().getTarget(2),
            props: {
                label: L(__export_wishlist),
                onclick: () => this.#openForm()
            }
        });
        return null;
    }

    #openForm(): void {
        const form = mount(ExportWishlistForm, {
            target: document.body,
            props: {
                language: this.context.language ?? new Language("english"),
                user: this.context.user,
                ownerId: this.context.ownerId,
                onclose: () => {
                    unmount(form)
                }
            }
        });
    }
}
