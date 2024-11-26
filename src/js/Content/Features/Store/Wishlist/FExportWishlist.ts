import {L} from "@Core/Localization/Localization";
import {__export_wishlist,} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import ExportWishlistForm from "@Content/Features/Store/Wishlist/Components/ExportWishlistForm.svelte";
import Language from "@Core/Localization/Language";
import WishlistButton from "@Content/Features/Store/Wishlist/Components/WishlistButton.svelte";


export default class FExportWishlist extends Feature<CWishlist> {

    override apply(): void {
        const container = document.querySelector(".wA5EFNQ7hrU-");

        if (!container) {
            throw new Error("Did not find container for buttons");
        }

        const button = new WishlistButton({
            target: container,
            anchor: container.firstElementChild ?? undefined,
            props: {
                label: L(__export_wishlist)
            }
        });
        button.$on("click", () => {
            const form = new ExportWishlistForm({
                target: document.body,
                props: {
                    language: this.context.language ?? new Language("english"),
                    user: this.context.user
                }
            });
            form.$on("close", () => form.$destroy());
        });
    }
}
