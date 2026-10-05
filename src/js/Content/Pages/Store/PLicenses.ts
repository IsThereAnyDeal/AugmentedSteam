/**
 * @contentScript
 * @match *://store.steampowered.com/account/licenses
 */

import StorePage from "../StorePage";
import CLicenses from "../../Features/Store/Licenses/CLicenses";

(new StorePage(CLicenses)).run();
