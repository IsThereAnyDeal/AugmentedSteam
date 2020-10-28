import {HTML, Localization} from "../../../core_modules";
import {Feature} from "../../../Modules/content";

export default class FInviteButton extends Feature {

    checkPrerequisites() {
        this._params = new URLSearchParams(window.location.search);
        return this._params.has("invitegid");
    }

    apply() {
        HTML.afterBegin("#manage_friends > div:nth-child(2)", `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup"><span>${Localization.str.invite_to_group}</span></span>`);

        this.context.runInPageContext(groupId => {
            /* eslint-disable no-undef, new-cap */
            ToggleManageFriends();
            $J("#invitetogroup").on("click", () => {
                const friends = GetCheckedAccounts("#search_results > .selectable.selected:visible");
                InviteUserToGroup(null, groupId, friends);
            });
            /* eslint-enable no-undef, new-cap */
        }, [this._params.get("invitegid")]);
    }
}
