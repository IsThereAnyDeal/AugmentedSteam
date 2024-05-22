/**
 * @contentScript
 * @match *://*.steampowered.com/account/registerkey
 */

import StorePage from "../../StorePage";
import CRegisterKey from "./CRegisterKey";

(new StorePage()).run(() => new CRegisterKey());
