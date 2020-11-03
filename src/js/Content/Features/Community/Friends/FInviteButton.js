import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInviteButton extends Feature {

    checkPrerequisites() {
        this._params = new URLSearchParams(window.location.search);
        return this._params.has("invitegid");
    }

    apply() {
        HTML.afterBegin("#manage_friends > div:nth-child(2)", `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup"><span>${Localization.str.invite_to_group}</span></span>`);

        Page.runInPageContext(groupId => {
            const f = window.SteamFacade;
            f.toggleManageFriends();
            f.jqOnClick("#invitetogroup", () => {
                const friends = f.getCheckedAccounts("#search_results > .selectable.selected:visible");
                f.inviteUserToGroup(null, groupId, friends);
            });
        }, [this._params.get("invitegid")]);
    }
}
