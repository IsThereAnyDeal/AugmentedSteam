/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/recommended
 * @match *://steamcommunity.com/(id|profiles)/*\/reviews
 */

import CommunityPage from "../../CommunityPage";
import CRecommended from "./CRecommended";

(new CommunityPage(CRecommended)).run();
