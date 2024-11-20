import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils from "@Content/Modules/Highlights/HighlightsTagsUtils";
import type {ASEvent} from "@Content/Modules/ASEventHandler";

export default class FWishlistHighlights extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn; // TODO ITAD status
    }

    override apply() {
        this.context.onWishlistUpdate.subscribe((e: ASEvent<HTMLElement[]>) => {
            HighlightsTagsUtils.highlightAndTag(e.data, {
                wishlisted: !this.context.myWishlist,
                waitlisted: !this.context.myWishlist
            });
        });
    }
}
