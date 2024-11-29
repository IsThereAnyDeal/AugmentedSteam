/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/friendsthatplay/*
 */

import CommunityPage from "../../CommunityPage";
import CFriendsThatPlay from "./CFriendsThatPlay";

(new CommunityPage(CFriendsThatPlay)).run();
