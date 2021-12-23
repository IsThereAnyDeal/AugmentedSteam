import {CommunityUtils, ContextType, Messenger} from "../../../modulesContent";
import {CCommunityBase} from "../CCommunityBase";
import FFriendsSort from "./FFriendsSort";
import FInviteFriendsToGroup from "./FInviteFriendsToGroup";
import FGroupsManageButton from "./FGroupsManageButton";
import FGroupsSort from "./FGroupsSort";
import {Page} from "../../Page";

import {HTML} from "../../../../modulesCore";

export class CFriendsAndGroups extends CCommunityBase {

    constructor() {

        super(ContextType.FRIENDS_AND_GROUPS, [
            FFriendsSort,
            FInviteFriendsToGroup,
            FGroupsManageButton,
            FGroupsSort,
        ]);

        this.myProfile = CommunityUtils.currentUserIsOwner();
        this._moveSearchBar();

        Page.runInPageContext(() => {
            window.SteamFacade.jq(document).ajaxSuccess((event, xhr, settings) => {
                if (/\/(friends|groups)(\/common)?\/?\?ajax=1$/.test(settings.url)) {
                    window.Messenger.postMessage("subpageNav");
                }
            });
        });

        Messenger.addMessageListener("subpageNav", () => {
            this._moveSearchBar();
            this.triggerCallbacks();
        });
    }

    _moveSearchBar() {
        if (document.getElementById("groups_list") !== null) {
            // Move the search bar on groups page to the same position as on friends page
            const container = HTML.wrap('<div class="searchBarContainer"></div>', "#search_text_box");
            document.getElementById("search_results").insertAdjacentElement("beforebegin", container);
        }
    }
}
