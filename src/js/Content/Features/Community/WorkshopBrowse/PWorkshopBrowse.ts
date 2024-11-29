/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles/browse
 * @match *://steamcommunity.com/workshop/browse
 */

import CommunityPage from "../../CommunityPage";
import CWorkshopBrowse from "./CWorkshopBrowse";

(new CommunityPage(CWorkshopBrowse)).run();
