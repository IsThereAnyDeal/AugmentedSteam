/**
 * @contentScript
 * @match *://steamcommunity.com/market
 */

import CommunityPage from "../../CommunityPage";
import CMarketHome from "./CMarketHome";

(new CommunityPage(CMarketHome)).run();
