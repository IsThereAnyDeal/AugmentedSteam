/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/edit/*
 */

import CommunityPage from "../CommunityPage";
import CProfileEdit from "../../Features/Community/ProfileEdit/CProfileEdit";

(new CommunityPage(CProfileEdit)).run();
