/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/stats/*
 */

import CommunityPage from "../../CommunityPage";
import CProfileStats from "./CProfileStats";

(new CommunityPage(CProfileStats)).run();
