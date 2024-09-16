import self_ from "./FWishlistActionButtons.svelte";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";

export default class FWishlistActionButtons extends Feature<CWishlist> {

    override apply(): void {

        const target = document.querySelector("#cart_status_data");
        if (!target) {
            throw new Error("Node not found");
        }

        new self_({
            target,
            anchor: target.firstElementChild!,
            props: {
                myWishlist: this.context.myWishlist,
                wishlistData: this.context.wishlistData
            }
        });
    }
}
