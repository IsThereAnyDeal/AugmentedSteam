/**
 * @contentScript
 * @match *://*.steampowered.com/account
 */


import StorePage from "@Content/Pages/StorePage";
import CAccount from "../../Features/Store/Account/CAccount";

(new StorePage(CAccount)).run();
