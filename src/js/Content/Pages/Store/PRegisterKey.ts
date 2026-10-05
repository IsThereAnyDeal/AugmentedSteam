/**
 * @contentScript
 * @match *://*.steampowered.com/account/registerkey
 */

import StorePage from "../StorePage";
import CRegisterKey from "../../Features/Store/RegisterKey/CRegisterKey";

(new StorePage(CRegisterKey)).run();
