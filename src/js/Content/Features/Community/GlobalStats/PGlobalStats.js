/**
 * @contentScript
 * @match *://steamcommunity.com/stats/*\/achievements
 */

import {CommunityPage} from "../../CommunityPage";
import {CGlobalStats} from "./CGlobalStats";

(new CommunityPage()).run(CGlobalStats);
