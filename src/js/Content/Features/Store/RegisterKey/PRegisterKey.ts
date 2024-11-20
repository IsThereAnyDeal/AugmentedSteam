/**
 * @contentScript
 * @match *://*.steampowered.com/account/registerkey
 */

import StorePage from "../../StorePage";
import CRegisterKey from "./CRegisterKey";

(new StorePage(CRegisterKey)).run();
