/**
 * @contentScript
 * @match *://*.steampowered.com/app/*
 */

import CApp from "@Content/Features/Store/App/CApp";
import StorePage from "@Content/Pages/StorePage";

(new StorePage(CApp)).run();
