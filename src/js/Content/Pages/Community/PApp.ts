/**
 * @contentScript
 * @match  *://steamcommunity.com/app/*
 * @exclude *://steamcommunity.com/app/*\/guides
 */

import CommunityPage from "../CommunityPage";
import CApp from "../../Features/Community/App/CApp";

(new CommunityPage(CApp)).run();
