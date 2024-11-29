/**
 * @contentScript
 * @match *://*.steampowered.com/app/*
 */

import CApp from "@Content/Features/Store/App/CApp";
import StorePage from "@Content/Features/StorePage";

(new StorePage(CApp)).run();
