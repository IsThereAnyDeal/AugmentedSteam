import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

export default class FWishlistProfileLink extends Feature<CWishlist> {

    override apply(): void {

        const profileLink = new URL(window.location.pathname.replace("/wishlist", ""), "https://steamcommunity.com");
        HTML.wrap(`<a class="as_wl_profile_link" href="${profileLink}" target="_blank"></a>`, ".wishlist_header > img", null);
    }
}
