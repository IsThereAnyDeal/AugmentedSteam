import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FWishlistProfileLink extends Feature {

    apply() {

        const profileLink = new URL(window.location.pathname.replace("/wishlist", ""), "https://steamcommunity.com");
        HTML.wrap(`<a class="as_wl_profile_link" href="${profileLink}" target="_blank"></a>`, ".wishlist_header > img", null);
    }
}
