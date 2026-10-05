/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/myworkshopfiles[/]?*browsefilter=mysubscriptions*
 */

import CommunityPage from "../CommunityPage";
import CMyWorkshop from "../../Features/Community/MyWorkshop/CMyWorkshop";

(new CommunityPage(CMyWorkshop)).run();
