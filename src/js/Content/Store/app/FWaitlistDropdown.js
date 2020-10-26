import {Feature} from "modules";

import {HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Background, ExtensionLayer} from "common";

export default class FWaitlistDropdown extends Feature {

    checkPrerequisites() {
        return document.querySelector("#add_to_wishlist_area")
            && SyncedStorage.get("add_to_waitlist")
            && Background.action("itad.isconnected");
    }

    async apply() {

        /*
         * This node will be hidden behind the dropdown menu.
         * Also, it's not really desirable when using dropdown menus to have a permanent div floating nearby
         */
        const notice = document.querySelector(".wishlist_added_temp_notice");
        if (notice) { notice.remove(); }

        const wishlistDivs = document.querySelectorAll("#add_to_wishlist_area,#add_to_wishlist_area_success");
        const [wishlistArea, wishlistSuccessArea] = wishlistDivs;

        HTML.afterEnd(".queue_actions_ctn :first-child",
            `<div style="position: relative; display: inline-block;">
                <div class="queue_control_button queue_btn_wishlist"></div>
            </div>`);

        /*
         * Creating a common parent for #add_to_wishlist_area and #add_to_wishlist_area_success
         * makes it easier to apply the dropdown menu
         */
        const wrapper = document.querySelector(".queue_btn_wishlist");

        // Move the wrapper such that there can't be any other elements in between the dropdown and other buttons (see #690)
        document.querySelector(".queue_actions_ctn").insertBefore(wrapper.parentNode, wishlistArea);

        wishlistDivs.forEach(div => {
            wrapper.appendChild(div);
            const button = div.querySelector(".btnv6_blue_hoverfade");
            button.style.borderTopRightRadius = 0;
            button.style.borderBottomRightRadius = 0;
        });

        HTML.afterEnd(wrapper,
            `<div class="queue_control_button queue_btn_ignore_menu" style="display: inline;">
                <div class="queue_ignore_menu_arrow btn_medium">
                    <span><img src="https://steamstore-a.akamaihd.net/public/images/v6/btn_arrow_down_padded.png"></span>
                </div>
                <div class="queue_ignore_menu_flyout">
                    <div class="queue_ignore_menu_flyout_content">
                        <div class="queue_ignore_menu_option" id="queue_ignore_menu_option_not_interested">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_ignore_menu_option_label">
                                <div class="option_title">${Localization.str.wishlist} (${Localization.str.theworddefault})</div>
                                <div class="option_subtitle">${Localization.str.add_to_wishlist}</div>
                            </div>
                        </div>
                        <div class="queue_ignore_menu_option" id="queue_ignore_menu_option_owned_elsewhere">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="https://steamstore-a.akamaihd.net/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_ignore_menu_option_label">
                                <div class="option_title">Waitlist</div>
                                <div class="option_subtitle">${Localization.str.add_to_waitlist}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);

        let wishlisted = document.querySelector("#add_to_wishlist_area").style.display === "none";
        let waitlisted = await Background.action("itad.inwaitlist", this.context.storeid);

        const menuArrow = document.querySelector(".queue_ignore_menu_arrow");
        const menu = document.querySelector(".queue_btn_ignore_menu");
        const wishlistOption = document.querySelector("#queue_ignore_menu_option_not_interested");
        const waitlistOption = document.querySelector("#queue_ignore_menu_option_owned_elsewhere");

        function updateDiv() {
            const oneActive = Boolean(wishlisted) || Boolean(waitlisted);

            menuArrow.classList.toggle("queue_btn_active", oneActive);
            menuArrow.classList.toggle("queue_btn_inactive", !oneActive);

            menu.classList.toggle("not_interested", wishlisted);
            menu.classList.toggle("owned_elsewhere", waitlisted);

            wishlistArea.style.display = oneActive ? "none" : "";
            wishlistSuccessArea.style.display = oneActive ? "" : "none";

            let text;
            if (wishlisted && !waitlisted) {
                text = Localization.str.on_wishlist;
            } else if (!wishlisted && waitlisted) {
                text = Localization.str.on_waitlist;
            } else if (wishlisted && waitlisted) {
                text = `${Localization.str.on_wishlist} & ${Localization.str.on_waitlist}`;
            } else {
                document.querySelector("#add_to_wishlist_area span").textContent = ` ${Localization.str.add_to_wishlist}`;
                return;
            }

            document.querySelector("#add_to_wishlist_area_success span").lastChild.textContent = ` ${text}`;
        }

        updateDiv();

        wishlistArea.querySelector("a").addEventListener("click", async() => {

            await ExtensionLayer.runInPageContext(() => new Promise(resolve => {
                /* eslint-disable no-undef */
                $J(document).ajaxComplete(function handler(e, xhr, {url}) {
                    if (url === "https://store.steampowered.com/api/addtowishlist") {
                        resolve();
                        $J(document).unbind("ajaxComplete", handler);
                    }
                });
                /* eslint-enable no-undef */
            }), null, true);

            wishlisted = !wishlisted;
            updateDiv();
        });

        this.context.onWishAndWaitlistRemove = () => {
            wishlisted = false;
            waitlisted = false;
            updateDiv();
        };

        wishlistOption.addEventListener("click", async() => {
            if (wishlisted) {
                await this.context.removeFromWishlist();
                wishlisted = !wishlisted;
                updateDiv();
            } else {
                wishlistArea.querySelector("a").click();
            }
        });

        waitlistOption.addEventListener("click", async() => {
            if (waitlisted) {
                await this.context.removeFromWaitlist();
            } else {
                await Background.action("itad.addtowaitlist", this.context.appid);
            }
            waitlisted = !waitlisted;
            updateDiv();
        });
    }
}
