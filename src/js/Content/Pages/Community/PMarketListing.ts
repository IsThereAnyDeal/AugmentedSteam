/**
 * @contentScript
 * @match *://steamcommunity.com/market/listings/*
 */

import CommunityPage from "../CommunityPage";
import CMarketListing from "../../Features/Community/MarketListing/CMarketListing";

(new CommunityPage(CMarketListing)).run();
