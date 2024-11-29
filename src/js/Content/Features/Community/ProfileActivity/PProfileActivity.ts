/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/home
 * @match *://steamcommunity.com/(id|profiles)/*\/myactivity
 * @match *://steamcommunity.com/(id|profiles)/*\/friendactivitydetail/*
 * @match *://steamcommunity.com/(id|profiles)/*\/status/*
 */

import CommunityPage from "../../CommunityPage";
import CProfileActivity from "./CProfileActivity";

(new CommunityPage(CProfileActivity)).run();
