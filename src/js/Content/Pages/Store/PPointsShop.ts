/**
 * @contentScript
 * @match *://*.steampowered.com/points[/*]
 */

import StorePage from "../StorePage";
import CPointsShop from "../../Features/Store/PointsShop/CPointsShop";

(new StorePage(CPointsShop)).run();
