/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles/browse
 * @match *://steamcommunity.com/workshop/browse
 */

import CommunityPage from "../CommunityPage";
import CWorkshopBrowse from "../../Features/Community/WorkshopBrowse/CWorkshopBrowse";

(new CommunityPage(CWorkshopBrowse)).run();
