import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Background, Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FWaitlistDropdown extends Feature {

    async checkPrerequisites() {
        return SyncedStorage.get("add_to_waitlist")
            && document.querySelector("#add_to_wishlist_area") !== null
            && (await Background.action("itad.isconnected")) === true;
    }

    async apply() {

        // Remove Steam's temp notice and native dropdown menu
        for (const node of document.querySelectorAll("#add_to_wishlist_area_success > div")) {
            node.remove();
        }

        const wishlistDivs = document.querySelectorAll("#add_to_wishlist_area,#add_to_wishlist_area_success");
        const [wishlistArea, wishlistSuccessArea] = wishlistDivs;

        HTML.afterEnd(".queue_actions_ctn :first-child",
            `<div style="position: relative; display: inline-block;">
                <div class="queue_control_button as_btn_wishlist"></div>
            </div>`);

        /*
         * Creating a common parent for #add_to_wishlist_area and #add_to_wishlist_area_success
         * makes it easier to apply the dropdown menu
         */
        const wrapper = document.querySelector(".as_btn_wishlist");

        // Move the wrapper such that there can't be any other elements in between the dropdown and other buttons (see #690)
        document.querySelector(".queue_actions_ctn").insertBefore(wrapper.parentNode, wishlistArea);

        wrapper.append(...wishlistDivs);

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
                                <div class="option_title">${Localization.str.wishlist} (${Localization.str.theworddefault})</div>
                                <div class="option_subtitle">${Localization.str.add_to_wishlist}</div>
                            </div>
                        </div>
                        <div class="queue_menu_option" id="queue_menu_option_on_waitlist">
                            <div>
                                <img class="queue_ignore_menu_option_image selected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_selected_bright.png">
                                <img class="queue_ignore_menu_option_image unselected" src="//store.cloudflare.steamstatic.com/public/images/v6/ico/ico_unselected_bright.png">
                            </div>
                            <div class="queue_menu_option_label">
                                <div class="option_title">Waitlist</div>
                                <div class="option_subtitle">${Localization.str.add_to_waitlist}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);

        let wishlisted = document.querySelector("#add_to_wishlist_area").style.display === "none";
        let waitlisted = await Background.action("itad.inwaitlist", this.context.storeid);

        const menu = document.querySelector(".as_btn_wishlist_menu");
        const menuArrow = menu.querySelector(".queue_menu_arrow");
        const wishlistOption = document.querySelector("#queue_menu_option_on_wishlist");
        const waitlistOption = document.querySelector("#queue_menu_option_on_waitlist");

        function updateDiv() {
            const oneActive = Boolean(wishlisted) || Boolean(waitlisted);

            menuArrow.classList.toggle("queue_btn_active", oneActive);

            menu.classList.toggle("on_wishlist", wishlisted);
            menu.classList.toggle("on_waitlist", waitlisted);

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

            await Page.runInPageContext(() => new Promise(resolve => {
                const d = window.SteamFacade.jq(document);
                d.ajaxComplete(function handler(e, xhr, {url}) {
                    if (url === "https://store.steampowered.com/api/addtowishlist") {
                        resolve();
                        d.unbind("ajaxComplete", handler);
                    }
                });
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
