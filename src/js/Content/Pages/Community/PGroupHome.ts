/**
 * @contentScript
 * @match *://steamcommunity.com/groups/*
 */

import CommunityPage from "../CommunityPage";
import CGroupHome from "../../Features/Community/GroupHome/CGroupHome";

(new CommunityPage(CGroupHome)).run();
