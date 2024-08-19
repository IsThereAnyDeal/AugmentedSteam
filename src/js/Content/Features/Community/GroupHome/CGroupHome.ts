import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FFriendsInviteButton from "./FFriendsInviteButton";
import FGroupLinks from "@Content/Features/Community/GroupHome/FGroupLinks";

export default class CGroupHome extends CCommunityBase {

    // @ts-ignore
    public readonly groupId: string;

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

        const groupIdNode = document.querySelector<HTMLInputElement>("input[name=groupId], input[name=abuseID]");
        if (!groupIdNode) {
            throw new Error("Did not find groupId");
        }

        this.groupId = groupIdNode.value;
    }
}
