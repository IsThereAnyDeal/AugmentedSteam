/**
 * @contentScript
 * @match *://*.steampowered.com/agecheck/*
 */

import StorePage from "@Content/Features/StorePage";
import CAgeCheck from "@Content/Features/Store/AgeCheck/CAgecheck";

(new StorePage(CAgeCheck)).run();
