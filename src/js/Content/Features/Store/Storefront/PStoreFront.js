/**
 * @contentScript
 * @matches *://store.steampowered.com/[?*]
 */

import {StorePage} from "../../StorePage";
import {CStoreFront} from "./CStoreFront";

(new StorePage()).run(CStoreFront);
