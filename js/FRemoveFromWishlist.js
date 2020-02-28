class FRemoveFromWishlist extends ASFeature {
    checkPrerequisites() {
        return User.isSignedIn && !this.context.isOwned();
    }

    apply() {

        // If game is already wishlisted, add required nodes
        if (!document.getElementById("add_to_wishlist_area")) {
            let firstButton = document.querySelector(".queue_actions_ctn a.queue_btn_active");
            let wlSuccessArea = HTML.wrap(firstButton, '<div id="add_to_wishlist_area_success"></div>');

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

        let addBtn = document.getElementById("add_to_wishlist_area");
        let successBtn = document.getElementById("add_to_wishlist_area_success");

        // Update tooltip for wishlisted items
        successBtn.querySelector("a").dataset.tooltipText = Localization.str.remove_from_wishlist_tooltip;

        let imgNode = successBtn.querySelector("img:last-child");
        imgNode.classList.add("es-in-wl");
        HTML.beforeBegin(imgNode,
            `<img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}" style="display: none;">
            <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">`);

        successBtn.addEventListener("click", async e => {
            e.preventDefault();

            let parent = successBtn.parentNode;
            if (!parent.classList.contains("loading")) {
                parent.classList.add("loading");

                let removeWaitlist = !!document.querySelector(".queue_btn_wishlist + .queue_btn_ignore_menu.owned_elsewhere");

                try {
                    await Promise.all([
                        this.context.removeFromWishlist(),
                        removeWaitlist ? this.context.removeFromWaitlist() : Promise.resolve(),
                    ]);

                    if (SyncedStorage.get("add_to_waitlist")) { this.context.onWishAndWaitlistRemove(); }

                    addBtn.style.display = "";
                    successBtn.style.display = "none";

                    // Clear dynamicstore cache
                    DynamicStore.clear();

                    // Invalidate dynamic store data cache
                    ExtensionLayer.runInPageContext(() => { GDynamicStore.InvalidateCache(); });
                } finally {
                    parent.classList.remove("loading");
                }
            }
        });

        for (let node of document.querySelectorAll("#add_to_wishlist_area, #add_to_wishlist_area_success, .queue_btn_ignore")) {
            node.addEventListener("click", DynamicStore.clear);
        }
    }
}

FRemoveFromWishlist.deps = [ FReplaceDevPubLinks ];
