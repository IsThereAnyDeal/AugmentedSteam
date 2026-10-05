/**
 * @contentScript
 * @match *://store.steampowered.com/[?*]
 */

import StorePage from "../StorePage";
import CStoreFront from "../../Features/Store/Storefront/CStoreFront";

(new StorePage(CStoreFront)).run();
