/**
 * @contentScript
 * @match *://*.steampowered.com/account
 */

import {StorePage} from "../../StorePage";
import {CAccount} from "./CAccount";

(new StorePage()).run(CAccount);
