/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/home
 * @exclude *://steamcommunity.com/(id|profiles)/*\/myactivity
 * @exclude *://steamcommunity.com/(id|profiles)/*\/friendactivitydetail/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/status/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/games
 * @exclude *://steamcommunity.com/(id|profiles)/*\/followedgames
 * @exclude *://steamcommunity.com/(id|profiles)/*\/edit/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/badges
 * @exclude *://steamcommunity.com/(id|profiles)/*\/gamecards/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/friendsthatplay/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/friends[/*]
 * @exclude *://steamcommunity.com/(id|profiles)/*\/groups[/*]
 * @exclude *://steamcommunity.com/(id|profiles)/*\/following[/*]
 * @exclude *://steamcommunity.com/(id|profiles)/*\/inventory
 * @exclude *://steamcommunity.com/(id|profiles)/*\/stats/*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/myworkshopfiles[/]?*browsefilter=mysubscriptions*
 * @exclude *://steamcommunity.com/(id|profiles)/*\/recommended
 * @exclude *://steamcommunity.com/(id|profiles)/*\/reviews
 */

import CommunityPage from "../../CommunityPage";
import CProfileHome from "./CProfileHome";
import CCommunityBase from "../CCommunityBase";

// This regex can't be translated to a match pattern / glob combination in the manifest
const className = /^\/(?:id|profiles)\/[^/]+\/?$/.test(window.location.pathname)
    ? CProfileHome
    : CCommunityBase;

(new CommunityPage(className)).run();