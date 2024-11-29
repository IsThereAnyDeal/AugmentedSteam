/**
 * @contentScript
 * @match *://steamcommunity.com/app/*\/guides
 */

import CommunityPage from "../../CommunityPage";
import CGuides from "./CGuides";

(new CommunityPage(CGuides)).run();
