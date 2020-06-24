import {ASFeature} from "../../ASFeature.js";
import {DynamicStore, ExtensionLayer, User} from "../../common.js";
import {ExtensionResources, HTML} from "../../../core.js";
import {Localization} from "../../../language.js";

export class FRemoveFromWishlist extends ASFeature {

    checkPrerequisites() {
        return User.isSignedIn && !this.context.isOwned();
    }

    apply() {

        // If game is already wishlisted, add required nodes
        if (!document.getElementById("add_to_wishlist_area")) {
            const firstButton = document.querySelector(".queue_actions_ctn a.queue_btn_active");
            const wlSuccessArea = HTML.wrap(firstButton, '<div id="add_to_wishlist_area_success"></div>');

            HTML.beforeBegin(wlSuccessArea,
                `<div id="add_to_wishlist_area" style="display: none;">
                    <a class="btnv6_blue_hoverfade btn_medium" data-tooltip-text="${Localization.str.add_to_wishlist_tooltip}">
                        <span>${Localization.str.add_to_wishlist}</span>
                    </a>
                </div>
                <div id="add_to_wishlist_area_fail" style="display: none;">
                    <b>${Localization.str.error}</b>
                </div>`);

            document.querySelector("#add_to_wishlist_area > a").href = `javascript:AddToWishlist(${this.context.appid}, 'add_to_wishlist_area', 'add_to_wishlist_area_success', 'add_to_wishlist_area_fail', null, 'add_to_wishlist_area2');`;
        }

        const addBtn = document.getElementById("add_to_wishlist_area");
        const successBtn = document.getElementById("add_to_wishlist_area_success");

        // Update tooltip for wishlisted items
        successBtn.querySelector("a").dataset.tooltipText = Localization.str.remove_from_wishlist_tooltip;

        const imgNode = successBtn.querySelector("img:last-child");
        imgNode.classList.add("es-in-wl");
        HTML.beforeBegin(imgNode,
            `<img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}" style="display: none;">
            <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">`);

        successBtn.addEventListener("click", async e => {
            e.preventDefault();

            const parent = successBtn.parentNode;
            if (!parent.classList.contains("loading")) {
                parent.classList.add("loading");

                const removeWaitlist = Boolean(document.querySelector(".queue_btn_wishlist + .queue_btn_ignore_menu.owned_elsewhere"));

                try {
                    await Promise.all([
                        this.context.removeFromWishlist(),
                        removeWaitlist ? this.context.removeFromWaitlist() : Promise.resolve(),
                    ]);

                    if (this.context.onWishAndWaitlistRemove) { this.context.onWishAndWaitlistRemove(); }

                    addBtn.style.display = "";

                    // Clear dynamicstore cache
                    DynamicStore.clear();

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext(() => { GDynamicStore.InvalidateCache(); });
                } catch (err) {
                    document.getElementById("add_to_wishlist_area_fail").style.display = "";
                    this.logError(err, "Failed to remove app from wishlist");
                } finally {
                    successBtn.style.display = "none";
                    parent.classList.remove("loading");
                }
            }
        });

        for (const node of document.querySelectorAll("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore")) {
            node.addEventListener("click", DynamicStore.clear);
        }
    }
}
