/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/friends[/*]
 * @match *://steamcommunity.com/(id|profiles)/*\/groups[/*]
 * @match *://steamcommunity.com/(id|profiles)/*\/following[/*]
 */

import CommunityPage from "../CommunityPage";
import CFriendsAndGroups from "../../Features/Community/FriendsAndGroups/CFriendsAndGroups";

(new CommunityPage(CFriendsAndGroups)).run();
