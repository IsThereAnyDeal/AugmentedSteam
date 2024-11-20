/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/myworkshopfiles[/]?*browsefilter=mysubscriptions*
 */

import CommunityPage from "../../CommunityPage";
import CMyWorkshop from "./CMyWorkshop";

(new CommunityPage(CMyWorkshop)).run();
