/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/games
 * @match *://steamcommunity.com/(id|profiles)/*\/followedgames
 */

import CommunityPage from "../../CommunityPage";
import CGames from "./CGames";

(new CommunityPage(CGames)).run();
