/**
 * @contentScript
 * @match *://*.steampowered.com/points[/*]
 */

import StorePage from "../../StorePage";
import CPointsShop from "./CPointsShop";

(new StorePage(CPointsShop)).run();
