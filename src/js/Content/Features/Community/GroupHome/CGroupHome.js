import ContextType from "../../../Modules/Context/ContextType";
import {CCommunityBase} from "../CCommunityBase";
import FFriendsInviteButton from "./FFriendsInviteButton";
import FGroupLinks from "./FGroupLinks";

export class CGroupHome extends CCommunityBase {

    constructor() {
        // Don't apply features if there's an error message (e.g. non-existent group)
        if (document.getElementById("message") !== null) {
            super(ContextType.GROUP_HOME);
            return;
        }

        super(ContextType.GROUP_HOME, [
            FFriendsInviteButton,
            FGroupLinks,
        ]);

        this.groupId = document.querySelector("input[name=groupId], input[name=abuseID]").value;
    }
}
