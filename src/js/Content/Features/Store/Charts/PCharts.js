/**
 * @contentScript
 * @match *://*.steampowered.com/charts[/*]
 */

import {StorePage} from "../../StorePage";
import {CCharts} from "./CCharts";

(new StorePage()).run(CCharts);
