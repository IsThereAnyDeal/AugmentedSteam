import {Feature} from "modules";

import {HTML, Localization} from "core";
import {ExtensionLayer, User} from "common";

export default class FProfileDropdownOptions extends Feature {

    checkPrerequisites() {
        return document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow") !== null;
    }

    apply() {

        const node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        if (!node) { return; }

        // add nickname option for non-friends
        if (User.isSignedIn) {

            // check whether we can chat => if we can we are friends => we have nickname option
            const canAddFriend = document.querySelector("#btn_add_friend");
            if (canAddFriend) {

                HTML.afterEnd(node, `<a class="popup_menu_item" id="es_nickname"><img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/notification_icon_edit_bright.png">&nbsp; ${Localization.str.add_nickname}</a>`);

                node.parentNode.querySelector("#es_nickname").addEventListener("click", () => {
                    ExtensionLayer.runInPageContext(() => {
                        ShowNicknameModal();
                        HideMenu("profile_action_dropdown_link", "profile_action_dropdown");
                    });
                });
            }
        }

        // post history link
        HTML.afterEnd(node,
            `<a class='popup_menu_item' id='es_posthistory' href='${window.location.pathname}/posthistory'>
                <img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; ${Localization.str.post_history}
                </a>`);
    }
}
