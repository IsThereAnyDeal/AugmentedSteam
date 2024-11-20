/**
 * @contentScript
 * @match *://*.steampowered.com/account
 */


import StorePage from "@Content/Features/StorePage";
import CAccount from "./CAccount";

(new StorePage(CAccount)).run();
