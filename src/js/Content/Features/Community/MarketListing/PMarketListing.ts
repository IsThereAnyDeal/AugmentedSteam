/**
 * @contentScript
 * @match *://steamcommunity.com/market/listings/*
 */

import CommunityPage from "../../CommunityPage";
import CMarketListing from "./CMarketListing";

(new CommunityPage(CMarketListing)).run();
