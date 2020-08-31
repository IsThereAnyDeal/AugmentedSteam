import {ASFeature} from "modules/ASFeature";

import {HTML, Localization, SyncedStorage} from "core";
import {Background} from "common";

export class FWishlistProfileLink extends ASFeature {

    checkPrerequisites() {
        return document.querySelector("body.profile_page.private_profile") === null
            && SyncedStorage.get("show_wishlist_link")
            && document.querySelector(".profile_item_links") !== null;
    }

    async apply() {

        let m = window.location.pathname.match(/^\/(?:profiles|id)\/[^\/]+/);
        if (!m) { return; }

        HTML.afterEnd(".profile_item_links .profile_count_link",
            `<div id="es_wishlist_link" class="profile_count_link">
                <a href="//store.steampowered.com/wishlist/${m[0]}">
                    <span class="count_link_label">${Localization.str.wishlist}</span>&nbsp;
                    <span id="es_wishlist_count" class="profile_count_link_total"></span>
                </a>
            </div>`);

        if (SyncedStorage.get("show_wishlist_count")) {

            let wishlistNode = document.querySelector(`.gamecollector_showcase .showcase_stat[href$="/wishlist/"]`);
            let count = wishlistNode ? wishlistNode.textContent.match(/\d+(?:,\d+)?/)[0] : await Background.action("wishlists", window.location.pathname);

            document.querySelector("#es_wishlist_count").textContent = count;
        }
    }
}
