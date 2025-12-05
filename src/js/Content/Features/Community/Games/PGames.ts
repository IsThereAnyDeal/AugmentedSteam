/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/games
 * @match *://steamcommunity.com/(id|profiles)/*\/followedgames
 */

import CGames from "./CGames";
import ReactPage from "@Content/Features/ReactPage";

(new ReactPage(CGames))
    .hydration()
    .then(page => page.run());
