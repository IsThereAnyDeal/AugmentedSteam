import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInviteButton extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myProfile;
    }

    setup() {
        this.callback();
    }

    callback() {
        if (!document.getElementById("friends_list")) { return; }

        HTML.afterBegin("#manage_friends > div:nth-child(2)",
            `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup">
                <span>${Localization.str.invite_to_group}</span>
            </span>`);

        const params = new URLSearchParams(window.location.search);

        if (params.has("invitegid")) {
            // Invite initiated from group homepage
            Page.runInPageContext(groupId => {
                const f = window.SteamFacade;
                f.toggleManageFriends();
                f.jqOnClick("#invitetogroup", () => {
                    const friends = f.getCheckedAccounts("#search_results > .selectable.selected:visible");
                    f.inviteUserToGroup(null, groupId, friends);
                });
            }, [params.get("invitegid")]);
        } else {
            document.getElementById("invitetogroup").addEventListener("click", () => {
                Page.runInPageContext(() => { window.SteamFacade.execFriendAction("group_invite", "friends/all"); });
            });
        }
    }
}
