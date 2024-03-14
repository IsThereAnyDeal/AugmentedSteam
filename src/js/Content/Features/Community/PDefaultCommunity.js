/**
 * @contentScript
 * @match *://steamcommunity.com/*
 * @exclude *://steamcommunity.com/login[/*]
 * @exclude *://steamcommunity.com/openid[/*]
 * @exclude *://steamcommunity.com/comment[/*]
 * @exclude *://steamcommunity.com/chat[/*]
 * @exclude *://steamcommunity.com/tradeoffer/*
 * @exclude *://steamcommunity.com/id/*
 * @exclude *://steamcommunity.com/profiles/*
 * @exclude *://steamcommunity.com/market[/*]
 * @exclude *://steamcommunity.com/groups/*
 * @exclude *://steamcommunity.com/app/*
 * @exclude *://steamcommunity.com/(sharedfiles|workshop)
 * @exclude *://steamcommunity.com/(sharedfiles|workshop)/browse
 * @exclude *://steamcommunity.com/(sharedfiles|workshop)/filedetails[/*]
 * @exclude *://steamcommunity.com/(sharedfiles|workshop)/editguide[/]?*
 * @exclude *://steamcommunity.com/tradingcards/boostercreator
 * @exclude *://steamcommunity.com/stats/*\/achievements
 */

import {CommunityPage} from "../CommunityPage";
import {CCommunityBase} from "./CCommunityBase";

(new CommunityPage()).run(CCommunityBase);
