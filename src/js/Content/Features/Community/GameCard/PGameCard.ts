/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/gamecards/*
 */

import CommunityPage from "../../CommunityPage";
import CGameCard from "./CGameCard";

(new CommunityPage(CGameCard)).run();
