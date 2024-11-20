/**
 * @contentScript
 * @match *://store.steampowered.com/account/licenses
 */

import StorePage from "../../StorePage";
import CLicenses from "./CLicenses";

(new StorePage(CLicenses)).run();
