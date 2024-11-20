/**
 * @contentScript
 * @match *://*.steampowered.com/cart[/*]
 */

import StorePage from "../../StorePage";
import CCart from "./CCart";

(new StorePage(CCart)).run();
