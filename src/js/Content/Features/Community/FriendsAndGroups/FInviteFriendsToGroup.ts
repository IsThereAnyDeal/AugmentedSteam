import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Feature from "@Content/Modules/Context/Feature";
import {__inviteToGroup} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import HTML from "@Core/Html/Html";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FInviteButton extends Feature<CFriendsAndGroups> {

    override checkPrerequisites(): boolean {
        return this.context.myProfile;
    }

    override apply(): void {
        document.addEventListener("as_subpageNav", () => { this.callback(); });
        this.callback();
    }

    private async callback(): Promise<void> {
        if (!document.getElementById("friends_list")) { return; }

        HTML.beforeEnd(".manage_friend_actions_ctn",
            `<span class="manage_action btnv6_lightblue_blue btn_small" id="es_invite_to_group">
                <span>${L(__inviteToGroup)}</span>
            </span>`);

        const params = new URLSearchParams(window.location.search);

        if (params.has("invitegid")) {
            DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/inviteToGroup.js", {groupId: params.get("invitegid")})
        } else {
            DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/inviteToGroupListener.js");
        }
    }
}
