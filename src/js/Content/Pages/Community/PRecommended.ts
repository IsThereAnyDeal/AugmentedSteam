/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/recommended
 * @match *://steamcommunity.com/(id|profiles)/*\/reviews
 */

import CommunityPage from "../CommunityPage";
import CRecommended from "../../Features/Community/Recommended/CRecommended";

(new CommunityPage(CRecommended)).run();
