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

        Page.runInPageContext(() => {
            window.SteamFacade.jq(document).ajaxSuccess((event, xhr, settings) => {
                if (/\/(friends|groups)\/?\?ajax=1$/.test(settings.url)) {
                    window.Messenger.postMessage("subpageNav");
                }
            });
        });

        Messenger.addMessageListener("subpageNav", () => {

            if (document.getElementById("groups_list") !== null) {
                // move the search bar to the same position as on friends page
                const container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
                document.getElementById("search_results").insertAdjacentElement("beforebegin", container);
            }

            this.triggerCallbacks();
        });
    }
}
