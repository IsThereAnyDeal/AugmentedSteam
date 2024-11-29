/**
 * @contentScript
 * @match *://store.steampowered.com/[?*]
 */

import StorePage from "../../StorePage";
import CStoreFront from "./CStoreFront";

(new StorePage(CStoreFront)).run();
