/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/edit/*
 */

import CommunityPage from "../../CommunityPage";
import CProfileEdit from "./CProfileEdit";

(new CommunityPage(CProfileEdit)).run();
