import {__inviteFriends} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";
import User from "@Content/Modules/User";
import HTML from "@Core/Html/Html";

export default class FFriendsInviteButton extends Feature<CGroupHome> {

    override checkPrerequisites(): boolean {
        return User.isSignedIn && document.querySelector(".grouppage_join_area") === null;
    }

    apply() {
        HTML.afterEnd("#join_group_form",
            `<div class="grouppage_join_area">
                <a class="btn_blue_white_innerfade btn_medium" href="https://steamcommunity.com/my/friends/?invitegid=${this.context.groupId}">
                    <span><img src="//community.cloudflare.steamstatic.com/public/images/groups/icon_invitefriends.png">&nbsp; ${L(__inviteFriends)}</span>
                </a>
            </div>`);
    }
}
