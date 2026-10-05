/**
 * @contentScript
 * @match *://steamcommunity.com/market
 */

import CommunityPage from "../CommunityPage";
import CMarketHome from "../../Features/Community/MarketHome/CMarketHome";

(new CommunityPage(CMarketHome)).run();
