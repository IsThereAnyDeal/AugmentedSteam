import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";

export default class FWishlistProfileLink extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile && SyncedStorage.get("show_wishlist_link");
    }

    async apply() {

        HTML.afterEnd(".profile_item_links .profile_count_link",
            `<div id="es_wishlist_link" class="profile_count_link ellipsis">
                <a href="//store.steampowered.com/wishlist${window.location.pathname}">
                    <span class="count_link_label">${Localization.str.wishlist}</span>&nbsp;
                    <span id="es_wishlist_count" class="profile_count_link_total"></span>
                </a>
            </div>`);

        if (SyncedStorage.get("show_wishlist_count")) {

            const wishlistNode = document.querySelector('.gamecollector_showcase .showcase_stat[href$="/wishlist/"]');

            document.querySelector("#es_wishlist_count").textContent = wishlistNode
                ? wishlistNode.textContent.match(/\d+(?:,\d+)?/)[0]
                : await Background.action("wishlists", window.location.pathname);
        }
    }
}
