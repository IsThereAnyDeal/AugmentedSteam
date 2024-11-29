/**
 * @contentScript
 * @match *://steamcommunity.com/tradingcards/boostercreator
 */

import CommunityPage from "../../CommunityPage";
import CBoosterCreator from "./CBoosterCreator";

(new CommunityPage(CBoosterCreator)).run();
