import {HTML, HTMLParser, Localization} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FChatDropdownOptions extends Feature {

    checkPrerequisites() {
        return User.isSignedIn;
    }

    apply() {

        const sendButton = document.querySelector("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!sendButton) { return; }

        const {"steamid": friendSteamId} = HTMLParser.getVariableFromDom("g_rgProfileData", "object");

        HTML.replace(sendButton,
            `<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link">
                <span>${sendButton.textContent}<img src="//community.cloudflare.steamstatic.com/public/images/profile/profile_action_dropdown.png"></span>
            </span>
            <div class="popup_block" id="profile_chat_dropdown">
                <div class="popup_body popup_menu shadow_content">
                    <a id="btnWebChat" class="popup_menu_item">
                        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.web_browser_chat}
                    </a>
                    <a class="popup_menu_item" href="steam://friends/message/${friendSteamId}">
                        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.steam_client_chat}
                    </a>
                </div>
            </div>`);

        document.querySelector("#btnWebChat").addEventListener("click", () => {
            Page.runInPageContext(steamId => {
                window.SteamFacade.openFriendChatInWebChat(steamId);
            }, [friendSteamId]);
        });

        document.querySelector("#profile_chat_dropdown_link").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.showMenu("profile_chat_dropdown_link", "profile_chat_dropdown", "right");
            });
        });

        document.querySelector("#profile_chat_dropdown").addEventListener("click", () => {
            Page.runInPageContext(() => {
                window.SteamFacade.hideMenu("profile_chat_dropdown_link", "profile_chat_dropdown");
            });
        });
    }
}
