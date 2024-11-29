/**
 * @contentScript
 * @match *://steamcommunity.com/market/search[/*]
 */

import CommunityPage from "../../CommunityPage";
import CMarketSearch from "./CMarketSearch";

(new CommunityPage(CMarketSearch)).run();
