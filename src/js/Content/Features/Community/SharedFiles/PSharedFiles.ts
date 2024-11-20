/**
 * @contentScript
 * @match *://steamcommunity.com/sharedfiles/filedetails[/*]
 * @match *://steamcommunity.com/workshop/filedetails[/*]
 */

import CommunityPage from "../../CommunityPage";
import CSharedFiles from "./CSharedFiles";

(new CommunityPage(CSharedFiles)).run();
