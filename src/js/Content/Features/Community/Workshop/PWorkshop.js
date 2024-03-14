/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles
 * @match *://steamcommunity.com/workshop
 */

import {CommunityPage} from "../../CommunityPage";
import {CWorkshop} from "./CWorkshop";

(new CommunityPage()).run(CWorkshop);
