import {L} from "@Core/Localization/Localization";
import {
    __addToWaitlist,
    __addToWishlist,
    __onWaitlist,
    __onWishlistAndWaitlist,
    __removeFromWaitlistTooltip,
    __removeFromWishlistAndWaitlistTooltip,
    __theworddefault,
    __wishlist,
} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import HTML from "@Core/Html/Html";
import ExtensionResources from "@Core/ExtensionResources";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FWaitlistDropdown extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.add_to_waitlist
            && document.querySelector("#add_to_wishlist_area") !== null
            && (await ITADApiFacade.isConnected());
    }

    override async apply(): Promise<void> {

        const parent = document.querySelector<HTMLElement>(".queue_actions_ctn");
        if (!parent) {
            return;
        }

        const wishlistArea = parent.querySelector<HTMLElement>("#add_to_wishlist_area")!;
        const wishlistSuccessArea = parent.querySelector<HTMLElement>("#add_to_wishlist_area_success")!;

        // Remove Steam's temp notice and native dropdown menu
        for (const node of wishlistSuccessArea.querySelectorAll(":scope > div")) {
            node.remove();
        }

        /*
         * Creating a common parent for #add_to_wishlist_area and #add_to_wishlist_area_success
         * makes it easier to apply the dropdown menu
         */
        HTML.beforeBegin(wishlistArea,
            `<div style="position: relative; display: inline-block;">
                <div class="queue_control_button as_btn_wishlist"></div>
            </div>`);

        const wrapper = parent.querySelector(".as_btn_wishlist")!;
        wrapper.append(wishlistArea, wishlistSuccessArea);

        HTML.afterEnd(wrapper,
            `<div class="queue_control_button queue_btn_menu as_btn_wishlist_menu">
                <div class="queue_menu_arrow btn_medium">
                    <span><img src="//store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded.png"></span>
                </div>
                <div class="queue_menu_flyout">
                    <div class="queue_menu_flyout_content">
                        <div class="queue_menu_option" id="queue_menu_option_on_wishlist">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_menu_option_label">
                                <div class="option_title">${L(__wishlist)} (${L(__theworddefault)})</div>
                                <div class="option_subtitle">${L(__addToWishlist)}</div>
                            </div>
                        </div>
                        <div class="queue_menu_option" id="queue_menu_option_on_waitlist">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_menu_option_label">
                                <div class="option_title">Waitlist</div>
                                <div class="option_subtitle">${L(__addToWaitlist)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);

        const removeBtn = wishlistSuccessArea.querySelector("a")!;
        const addBtn = wishlistArea.querySelector("a")!;

        // Add hover/loading images
        const imgNode = removeBtn.querySelector("img")!;
        imgNode.classList.add("es-in-wl");
        HTML.beforeBegin(imgNode,
            `<img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}">
            <img class="es-loading-wl" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif">`);

        // Trailing whitespace intended to separate image and text
        HTML.afterBegin(addBtn.querySelector("span"), `<img class="es-loading-wl" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif"> `);

        // Check response of ajax calls before updating button status
        DOMHelper.insertScript("scriptlets/Store/App/wishlistHandlers.js");

        let wishlisted = wishlistArea.style.display === "none";
        let waitlisted = (await ITADApiFacade.inWaitlist([this.context.storeid]))[this.context.storeid] ?? false;

        const menu = parent.querySelector(".as_btn_wishlist_menu")!;
        const menuArrow = menu.querySelector(".queue_menu_arrow")!;
        const wishlistOption = parent.querySelector("#queue_menu_option_on_wishlist")!;
        const waitlistOption = parent.querySelector("#queue_menu_option_on_waitlist")!;

        // Native localized text
        const removeFromWishlistLabel = wishlistSuccessArea.querySelector("span")!.lastChild!.textContent;
        const removeFromWishlistTooltip = wishlistSuccessArea.querySelector("a")!.dataset.tooltipText;

        function updateDiv() {
            parent!.classList.remove("loading");

            const oneActive = Boolean(wishlisted) || Boolean(waitlisted);

            menuArrow.classList.toggle("queue_btn_active", oneActive);

            menu.classList.toggle("on_wishlist", wishlisted);
            menu.classList.toggle("on_waitlist", waitlisted);

            wishlistArea.style.display = oneActive ? "none" : "";
            wishlistSuccessArea.style.display = oneActive ? "" : "none";

            let text, tooltip;
            if (wishlisted && !waitlisted) {
                text = removeFromWishlistLabel;
                tooltip = removeFromWishlistTooltip;
            } else if (!wishlisted && waitlisted) {
                text = L(__onWaitlist);
                tooltip = L(__removeFromWaitlistTooltip);
            } else if (wishlisted && waitlisted) {
                text = L(__onWishlistAndWaitlist);
                tooltip = L(__removeFromWishlistAndWaitlistTooltip);
            } else {
                tooltip = removeFromWishlistTooltip;
            }

            if (text) {
                wishlistSuccessArea.querySelector("span")!.lastChild!.textContent = ` ${text}`;
            }

            removeBtn.dataset.tooltipText = tooltip;

            // Tooltips by default are stored internally by jQuery, so replace it after changing the attribute
            SteamFacade.vTooltip("#add_to_wishlist_area_success > a");
        }

        updateDiv();

        // Click add-to-wishlist, only add to wishlist
        addBtn.addEventListener("click", async() => {
            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");

            const result = await (new Promise<boolean>(resolve => {
                // @ts-expect-error
                document.addEventListener("addRemoveWishlist",
                    (e: CustomEvent<boolean>) => resolve(e.detail)),
                    {once: true}
            }));
            if (result) {
                wishlisted = !wishlisted;
                updateDiv();
            } else {
                parent.classList.remove("loading");
            }
        });

        // Click remove-from-wishlist, remove from both wishlist and waitlist
        removeBtn.addEventListener("click", async(e) => {
            if (!wishlisted) {
                // Prevent default action if item is only waitlisted
                e.preventDefault();
            }

            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");

            if (wishlisted) {
                await new Promise<void>(resolve => {
                    document.addEventListener("addRemoveWishlist", () => {
                        wishlisted = !wishlisted;
                        resolve();
                    }, {once: true});
                });
            }

            if (waitlisted) {
                await ITADApiFacade.removeFromWaitlist(this.context.appid);
                waitlisted = !waitlisted;
            }

            updateDiv();
        });

        wishlistOption.addEventListener("click", async() => {
            if (wishlisted) {
                if (parent.classList.contains("loading")) { return; }
                parent.classList.add("loading");

                await new Promise<void>(resolve => {
                    // @ts-ignore
                    document.addEventListener("addRemoveWishlist", (e: CustomEvent<boolean>) => {
                        if (e.detail) {
                            wishlisted = !wishlisted;
                            updateDiv();
                        } else {
                            parent.classList.remove("loading");
                        }
                        resolve();
                    }, {once: true});

                    // Use Steam's method here so wishlist count is updated and dynamic store cache invalidated
                    SteamFacade.removeFromWishlist(
                        this.context.appid,
                        "add_to_wishlist_area_success",
                        "add_to_wishlist_area",
                        "add_to_wishlist_area_fail",
                        "1_store-navigation__",
                        "add_to_wishlist_area2"
                    );
                });
            } else {
                addBtn.dispatchEvent(new MouseEvent("click"));
            }
        });

        waitlistOption.addEventListener("click", async() => {
            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");

            if (waitlisted) {
                await ITADApiFacade.removeFromWaitlist(this.context.appid);
            } else {
                await ITADApiFacade.addToWaitlist(this.context.appid);
            }

            waitlisted = !waitlisted;
            updateDiv();
        });
    }
}
