/**
 * @contentScript
 * @match *://*.steampowered.com/cart[/*]
 */

import StorePage from "../StorePage";
import CCart from "../../Features/Store/Cart/CCart";

(new StorePage(CCart)).run();
