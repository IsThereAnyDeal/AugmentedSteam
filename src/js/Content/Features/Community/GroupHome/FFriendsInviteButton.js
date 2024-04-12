import {__inviteFriends} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Feature, User} from "../../../modulesContent";

export default class FFriendsInviteButton extends Feature {

    checkPrerequisites() {
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
