/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/stats/*
 */

import CommunityPage from "../CommunityPage";
import CProfileStats from "../../Features/Community/ProfileStats/CProfileStats";

(new CommunityPage(CProfileStats)).run();
