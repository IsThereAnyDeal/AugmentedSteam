import CCommunityBase from "../CCommunityBase";
import FFriendsSort from "./FFriendsSort";
import FInviteFriendsToGroup from "./FInviteFriendsToGroup";
import FGroupsManageButton from "./FGroupsManageButton";
import FGroupsSort from "./FGroupsSort";
import FFriendsAppendNickname from "./FFriendsAppendNickname";
import ContextType from "@Content/Modules/Context/ContextType";
import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import HTML from "@Core/Html/Html";
import DOMHelper from "@Content/Modules/DOMHelper";
import type {ContextParams} from "@Content/Modules/Context/Context";

export default class CFriendsAndGroups extends CCommunityBase {

    public readonly myProfile: boolean;

    constructor(params: ContextParams) {

        super(params, ContextType.FRIENDS_AND_GROUPS, [
            FFriendsSort,
            FInviteFriendsToGroup,
            FGroupsManageButton,
            FGroupsSort,
            FFriendsAppendNickname,
        ]);

        this.myProfile = CommunityUtils.userIsOwner(this.user);
        this._moveSearchBar();

        document.addEventListener("as_subpageNav", () => {
            this._moveSearchBar();
        });

        DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/subpageNav.js");
    }

    _moveSearchBar() {
        if (document.getElementById("groups_list") !== null) {
            // Move the search bar on groups page to the same position as on friends page
            const container = HTML.wrap(
                '<div class="searchBarContainer"></div>',
                "#search_text_box"
            );
            if (container) {
                document.getElementById("search_results")?.insertAdjacentElement("beforebegin", container);
            }
        }
    }
}
