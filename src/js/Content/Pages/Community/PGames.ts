/**
 * @contentScript
 * @match *://steamcommunity.com/(id|profiles)/*\/games
 * @match *://steamcommunity.com/(id|profiles)/*\/followedgames
 */

import CGames from "../../Features/Community/Games/CGames";
import ReactPage from "@Content/Pages/ReactPage";

(new ReactPage(CGames))
    .hydration()
    .then(page => page.run());
