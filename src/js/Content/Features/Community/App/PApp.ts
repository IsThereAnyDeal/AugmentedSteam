/**
 * @contentScript
 * @match  *://steamcommunity.com/app/*
 * @exclude *://steamcommunity.com/app/*\/guides
 */

import CommunityPage from "../../CommunityPage";
import CApp from "./CApp";

(new CommunityPage(CApp)).run();
