/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/gamecards/*
 */

import CommunityPage from "../CommunityPage";
import CGameCard from "../../Features/Community/GameCard/CGameCard";

(new CommunityPage(CGameCard)).run();
