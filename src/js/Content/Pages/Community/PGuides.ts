/**
 * @contentScript
 * @match *://steamcommunity.com/app/*\/guides
 */

import CommunityPage from "../CommunityPage";
import CGuides from "../../Features/Community/Guides/CGuides";

(new CommunityPage(CGuides)).run();
