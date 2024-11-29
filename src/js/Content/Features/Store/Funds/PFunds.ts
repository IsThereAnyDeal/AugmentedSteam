/**
 * @contentScript
 * @match *://*.steampowered.com/steamaccount/addfunds
 * @match *://*.steampowered.com/digitalgiftcards/selectgiftcard
 */

import StorePage from "../../StorePage";
import CFunds from "./CFunds";

(new StorePage(CFunds)).run();
