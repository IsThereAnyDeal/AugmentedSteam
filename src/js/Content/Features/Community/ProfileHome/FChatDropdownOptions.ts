import HTML from "@Core/Html/Html";
import HTMLParser from "@Core/Html/HtmlParser";
import {__steamClientChat, __webBrowserChat} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import User from "@Content/Modules/User";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FChatDropdownOptions extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return User.isSignedIn;
    }

    override apply(): void {

        const sendButton = document.querySelector("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!sendButton) { return; }

        const data = HTMLParser.getObjectVariable<{steamid: string}>("g_rgProfileData");
        const friendSteamId = data?.steamid;
        if (!friendSteamId) { return; }

        HTML.replace(sendButton,
            `<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link">
                <span>${sendButton.textContent}<img src="//community.cloudflare.steamstatic.com/public/images/profile/profile_action_dropdown.png"></span>
            </span>
            <div class="popup_block" id="profile_chat_dropdown">
                <div class="popup_body popup_menu shadow_content">
                    <a id="btnWebChat" class="popup_menu_item">
                        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${L(__webBrowserChat)}
                    </a>
                    <a class="popup_menu_item" href="steam://friends/message/${friendSteamId}">
                        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${L(__steamClientChat)}
                    </a>
                </div>
            </div>`);

        DOMHelper.insertScript("scriptlets/Community/ProfileHome/chatDropdownOptions.js", {friendSteamId});
    }
}
