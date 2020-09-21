import {ASFeature} from "modules";

import {HTML, Localization} from "core";
import {ExtensionLayer} from "common";

export class FInviteButton extends ASFeature {
    
    checkPrerequisites() {
        this._params = new URLSearchParams(window.location.search);
        return this._params.has("invitegid");
    }

    apply() {
        HTML.afterBegin("#manage_friends > div:nth-child(2)", `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup"><span>${Localization.str.invite_to_group}</span></span>`);

        ExtensionLayer.runInPageContext(groupId => {
            ToggleManageFriends();
            $J("#invitetogroup").on("click", () => {
                let friends = GetCheckedAccounts("#search_results > .selectable.selected:visible");
                InviteUserToGroup(null, groupId, friends);
            });
        }, [ this._params.get("invitegid") ]);
    }
}
