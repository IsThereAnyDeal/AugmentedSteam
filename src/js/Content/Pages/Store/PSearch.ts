/**
 * @contentScript
 * @match *://*.steampowered.com/search[/*]
 */

import StorePage from "../StorePage";
import CSearch from "../../Features/Store/Search/CSearch";

(new StorePage(CSearch)).run();
