/**
 * @contentScript
 * @match *://steamcommunity.com/tradingcards/boostercreator
 */

import CommunityPage from "../CommunityPage";
import CBoosterCreator from "../../Features/Community/BoosterCreator/CBoosterCreator";

(new CommunityPage(CBoosterCreator)).run();
