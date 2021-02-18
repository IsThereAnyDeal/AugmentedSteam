import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInviteButton extends Feature {

    checkPrerequisites() {
        return document.querySelector("#manage_friends_control") !== null;
    }

    apply() {

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
