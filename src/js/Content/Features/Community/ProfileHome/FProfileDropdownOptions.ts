import {__addNickname, __postHistory} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FProfileDropdownOptions extends Feature<CProfileHome> {

    private _node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        this._node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        return this._node !== null;
    }

    override apply(): void {

        // add nickname option for non-friends
        if (this.context.user.isSignedIn) {

            // Selects the "Add Friend" button (ID selector for unblocked, class selector for blocked users)
            if (document.querySelector("#btn_add_friend, .profile_header_actions > .btn_profile_action_disabled")) {
                HTML.afterEnd(this._node,
                    `<a class="popup_menu_item" id="es_nickname">
                        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/notification_icon_edit_bright.png">&nbsp; ${L(__addNickname)}
                    </a>`);
            }

            DOMHelper.insertScript("scriptlets/Community/ProfileHome/profileDropdown.js");
        }

        // add post history link
        HTML.afterEnd(this._node,
            `<a class="popup_menu_item" href="${window.location.pathname}/posthistory">
                <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png">&nbsp; ${L(__postHistory)}
            </a>`);
    }
}
