/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles/editguide[/]?*
 * @match *://steamcommunity.com/workshop/editguide[/]?*
 */

import CommunityPage from "../../CommunityPage";
import CEditGuide from "./CEditGuide";

(new CommunityPage(CEditGuide)).run();
