import {HTML, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FProfileDropdownOptions extends Feature {

    checkPrerequisites() {
        this._node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        return this._node !== null;
    }

    apply() {

        // add nickname option for non-friends
        if (User.isSignedIn) {

            // Selects the "Add Friend" button (ID selector for unblocked, class selector for blocked users)
            if (document.querySelector("#btn_add_friend, .profile_header_actions > .btn_profile_action_disabled")) {

                HTML.afterEnd(this._node,
                    `<a class="popup_menu_item" id="es_nickname">
                        <img src="//community.akamai.steamstatic.com/public/images/skin_1/notification_icon_edit_bright.png">&nbsp; ${Localization.str.add_nickname}
                    </a>`);

                document.querySelector("#es_nickname").addEventListener("click", () => {
                    Page.runInPageContext(() => {
                        const f = window.SteamFacade;
                        f.showNicknameModal();
                        f.hideMenu("profile_action_dropdown_link", "profile_action_dropdown");
                    });
                });
            }

            // Show current nickname in input box
            Page.runInPageContext(() => {
                const oldShowNicknameModal = window.ShowNicknameModal;

                window.ShowNicknameModal = function() {
                    oldShowNicknameModal();

                    const nicknameNode = document.querySelector(".persona_name .nickname");
                    if (nicknameNode !== null) {
                        document.querySelector(".newmodal input[type=text]").value = nicknameNode.textContent.trim().slice(1, -1);
                    }
                };
            });
        }

        // add post history link
        HTML.afterEnd(this._node,
            `<a class="popup_menu_item" href="${window.location.pathname}/posthistory">
                <img src="//community.akamai.steamstatic.com/public/images/skin_1/icon_btn_comment.png">&nbsp; ${Localization.str.post_history}
            </a>`);
    }
}
