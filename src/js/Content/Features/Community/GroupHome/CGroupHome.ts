import ContextType from "@Content/Modules/Context/ContextType";
import CCommunityBase from "../CCommunityBase";
import FFriendsInviteButton from "./FFriendsInviteButton";
import FGroupLinks from "@Content/Features/Community/GroupHome/FGroupLinks";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CGroupHome extends CCommunityBase {

    public readonly groupId: string|null = null;

    constructor(params: ContextParams) {

        // Don't apply features if there's an error message (e.g. non-existent group)
        const hasFeatures = document.getElementById("message") === null;

        super(params, ContextType.GROUP_HOME, hasFeatures ? [
            FFriendsInviteButton,
            FGroupLinks,
        ] : []);

        if (!hasFeatures) {
            return;
        }

        // Check `#leave_group_form` when logged in; fallback to the join chat button otherwise
        this.groupId = document.querySelector<HTMLInputElement>("input[name=groupId]")?.value
            ?? document.querySelector(".joinchat_bg")
                ?.getAttribute("onclick")
                ?.match(/OpenGroupChat\(\s*'(\d+)'/)
                ?.[1]
            ?? null;
    }
}
