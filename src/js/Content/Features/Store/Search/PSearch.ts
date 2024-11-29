/**
 * @contentScript
 * @match *://*.steampowered.com/search[/*]
 */

import StorePage from "../../StorePage";
import CSearch from "./CSearch";

(new StorePage(CSearch)).run();
