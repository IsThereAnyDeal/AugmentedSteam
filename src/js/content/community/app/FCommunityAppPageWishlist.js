import {Feature} from "modules";

import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Background, DynamicStore, User} from "common";

export default class FCommunityAppPageWishlist extends Feature {

    checkPrerequisites() {
        return User.isSignedIn && SyncedStorage.get("wlbuttoncommunityapp");
    }

    async apply() {

        await DynamicStore;

        let {owned, wishlisted} = await DynamicStore.getAppStatus(`app/${this.context.appid}`);
        if (owned) { return; }

        let inactiveStyle = "";
        let activeStyle = "display: none;";

        if (wishlisted) {
            inactiveStyle = "display: none;";
            activeStyle = "";
        }

        const parent = document.querySelector(".apphub_OtherSiteInfo");
        HTML.beforeEnd(
            parent,
            ` <a id="es_wishlist_add" class="btnv6_blue_hoverfade btn_medium" style="${inactiveStyle}">
                  <span>
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      ${Localization.str.add_to_wishlist}
                  </span>
              </a>
              <a id="es_wishlist_success" class="btnv6_blue_hoverfade btn_medium" style="${activeStyle}">
                  <span>
                      <img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}" style="display: none;">
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      <img class="es-in-wl" src="//steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected.png" border="0">
                      ${Localization.str.on_wishlist}
                  </span>
              </a>
              <div id="es_wishlist_fail" style="display: none;">
                  <b>${Localization.str.error}</b>
              </div>`
        );

        const addBtn = document.getElementById("es_wishlist_add");
        const successBtn = document.getElementById("es_wishlist_success");
        const failNode = document.getElementById("es_wishlist_fail");

        const that = this;

        async function handler(e) {
            e.preventDefault();

            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");
            failNode.style.display = "none";

            wishlisted = e.currentTarget === successBtn;
            const action = wishlisted ? "wishlist.remove" : "wishlist.add";

            try {
                await Background.action(action, that.appid);

                successBtn.style.display = wishlisted ? "none" : "";
                addBtn.style.display = wishlisted ? "" : "none";

                DynamicStore.clear();
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
