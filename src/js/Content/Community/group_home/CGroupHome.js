import ContextType from "../../../Modules/Content/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FFriendsInviteButton from "./FFriendsInviteButton";
import FGroupLinks from "./FGroupLinks";

export class CGroupHome extends CCommunityBase {

    constructor() {
        super(ContextType.GROUP_HOME, [
            FFriendsInviteButton,
            FGroupLinks,
        ]);
    }

    get groupId() {

        if (this._groupId) { return this._groupId; }

        if (document.getElementById("leave_group_form")) {
            this._groupId = document.querySelector("input[name=groupId]").value;
        } else {
            this._groupId = document.querySelector(".joinchat_bg").getAttribute("onclick")
                .split("'")[1];
        }

        return this._groupId;
    }
}
