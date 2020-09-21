import {Feature} from "modules";

import {HTML, HTMLParser, Localization} from "core";
import {ExtensionLayer, User} from "common";

export default class FChatDropdownOptions extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        let sendButton = document.querySelector("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!sendButton) { return; }

        let m = sendButton.href.match(/javascript:OpenFriendChat\( '(\d+)'.*\)/);
        if (!m) { return; }
        let chatId = m[1];

        let rgProfileData = HTMLParser.getVariableFromDom("g_rgProfileData", "object");
        let friendSteamId = rgProfileData.steamid;

        HTML.replace(sendButton,
            `<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link">
                <span>${sendButton.textContent}<img src="https://steamcommunity-a.akamaihd.net/public/images/profile/profile_action_dropdown.png"></span>
            </span>
            <div class="popup_block" id="profile_chat_dropdown" style="visibility: visible; top: 168px; left: 679px; display: none; opacity: 1;">
                <div class="popup_body popup_menu shadow_content" style="box-shadow: 0 0 12px #000">
                    <a id="btnWebChat" class="popup_menu_item webchat">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.web_browser_chat}
                    </a>
                    <a class="popup_menu_item" href="steam://friends/message/${friendSteamId}">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.steam_client_chat}
                    </a>
                </div>
            </div>`);

        document.querySelector("#btnWebChat").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(chatId => { OpenFriendChatInWebChat(chatId); }, [ chatId ]);
        });

        document.querySelector("#profile_chat_dropdown_link").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ShowMenu(document.querySelector("#profile_chat_dropdown_link"), "profile_chat_dropdown", "right"); });
        });
    }
}
