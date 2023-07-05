import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Background, DynamicStore, Feature, User} from "../../../modulesContent";

export default class FCommunityAppPageWishlist extends Feature {

    checkPrerequisites() {
        return User.isSignedIn
            && SyncedStorage.get("wlbuttoncommunityapp")
            && (this._node = document.querySelector(".apphub_OtherSiteInfo")) !== null;
    }

    async apply() {

        const appid = this.context.appid;

        let {owned, wishlisted} = await DynamicStore.getAppStatus(`app/${appid}`);
        if (owned) { return; }

        const parent = this._node;

        HTML.beforeEnd(parent,
            // First whitespace intended, separates buttons
            ` <a id="es_wishlist_add" class="btnv6_blue_hoverfade btn_medium" style="${wishlisted ? "display: none;" : ""}">
                <span>
                    <img class="es-loading-wl" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    ${Localization.str.add_to_wishlist}
                </span>
            </a>
            <a id="es_wishlist_success" class="btnv6_blue_hoverfade btn_medium" style="${wishlisted ? "" : "display: none;"}">
                <span>
                    <img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}">
                    <img class="es-loading-wl" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">
                    <img class="es-in-wl" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected.png" border="0">
                    ${Localization.str.on_wishlist}
                </span>
            </a>
            <div id="es_wishlist_fail">
                <b>${Localization.str.error}</b>
            </div>`);

        const addBtn = document.getElementById("es_wishlist_add");
        const successBtn = document.getElementById("es_wishlist_success");
        const failNode = document.getElementById("es_wishlist_fail");

        async function handler(e) {
            e.preventDefault();

            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");
            failNode.style.display = "none";

            wishlisted = e.currentTarget === successBtn;
            const action = wishlisted ? "wishlist.remove" : "wishlist.add";

            try {
                await Background.action(action, appid);

                successBtn.style.display = wishlisted ? "none" : "";
                addBtn.style.display = wishlisted ? "" : "none";

            } catch (err) {

                /*
                 * We can't (easily) detect whether or not the user is logged in to the store,
                 * therefore we're also not able to provide more details here
                 */
                console.error("Failed to add to/remove from wishlist");
                failNode.style.display = "block";
            } finally {
                parent.classList.remove("loading");
            }
        }

        addBtn.addEventListener("click", handler);
        successBtn.addEventListener("click", handler);
    }
}
