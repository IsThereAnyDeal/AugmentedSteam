/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/badges
 */

import CommunityPage from "../../CommunityPage";
import CBadges from "./CBadges";

(new CommunityPage(CBadges)).run();
