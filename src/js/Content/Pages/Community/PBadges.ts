/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/badges
 */

import CommunityPage from "../CommunityPage";
import CBadges from "../../Features/Community/Badges/CBadges";

(new CommunityPage(CBadges)).run();
