import CommunityUtils from "@Content/Modules/Community/CommunityUtils";
import HTML from "@Core/Html/Html";
import DOMHelper from "@Content/Modules/DOM/DOMHelper";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import {bootstrapLegacy, features} from "@Content/bootstrap";
import commonFeatures from "@Content/Features/Common/_commonFeatures";
import FFriendsSort from "@Content/Features/Community/FriendsAndGroups/FFriendsSort";
import ASEventHandler from "@Content/Modules/Events/ASEventHandler";
import FInviteFriendsToGroup from "./FInviteFriendsToGroup";
import FGroupsManageButton from "@Content/Features/Community/FriendsAndGroups/FGroupsManageButton";
import FGroupsSort from "@Content/Features/Community/FriendsAndGroups/FGroupsSort";
import FFriendsAppendNickname from "@Content/Features/Community/FriendsAndGroups/FFriendsAppendNickname";

export default class CFriendsAndGroups extends Context {

    readonly myProfile: boolean;

    onSubpageNav: ASEventHandler<void>

    constructor(params: ContextParams) {
        super(params);

        this.myProfile = CommunityUtils.userIsOwner(this.user);
        this.#moveSearchBar();

        this.onSubpageNav = new ASEventHandler();

        document.addEventListener("as_subpageNav", () => {
            this.#moveSearchBar();
            this.onSubpageNav.dispatch();
        });

        DOMHelper.insertScript("scriptlets/Community/FriendsAndGroups/subpageNav.js");
    }

    #moveSearchBar() {
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


/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/friends[/*]
 * @match *://steamcommunity.com/(id|profiles)/*\/groups[/*]
 * @match *://steamcommunity.com/(id|profiles)/*\/following[/*]
 */
export async function run(): Promise<void> {
    const params = await bootstrapLegacy();
    const context = new CFriendsAndGroups(params);

    await features(context, [
        ...commonFeatures(),
        FFriendsSort,
        FInviteFriendsToGroup,
        FGroupsManageButton,
        FGroupsSort,
        FFriendsAppendNickname,
    ]);
}