import {CCommunityBase} from "community/common/CCommunityBase";
import {ContextTypes} from "modules";

import {FFriendsInviteButton} from "./FFriendsInviteButton";
import {FGroupLinks} from "./FGroupLinks";

export class CGroupHomePage extends CCommunityBase {

    constructor() {
        super([
            FFriendsInviteButton,
            FGroupLinks,
        ]);

        this.type = ContextTypes.GROUP_HOME;
    }

    get groupId() {
        
        if (this._groupId) { return this._groupId; }

        if (document.getElementById("leave_group_form")) {
            this._groupId = document.querySelector("input[name=groupId]").value;
        } else {
            this._groupId = document.querySelector(".joinchat_bg").getAttribute("onclick").split('\'')[1];
        }

        return this._groupId;
    }
}
