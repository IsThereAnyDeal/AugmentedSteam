/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles
 * @match *://steamcommunity.com/workshop
 */

import CommunityPage from "../CommunityPage";
import CWorkshop from "../../Features/Community/Workshop/CWorkshop";

(new CommunityPage(CWorkshop)).run();
