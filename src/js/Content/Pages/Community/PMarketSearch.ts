/**
 * @contentScript
 * @match *://steamcommunity.com/market/search[/*]
 */

import CommunityPage from "../CommunityPage";
import CMarketSearch from "../../Features/Community/MarketSearch/CMarketSearch";

(new CommunityPage(CMarketSearch)).run();
