/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/friendsthatplay/*
 */

import CommunityPage from "../CommunityPage";
import CFriendsThatPlay from "../../Features/Community/FriendsThatPlay/CFriendsThatPlay";

(new CommunityPage(CFriendsThatPlay)).run();
