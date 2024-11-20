/**
 * @contentScript
 * @match *://*.steampowered.com/sub/*
 */

import StorePage from "../../StorePage";
import CSub from "./CSub";

(new StorePage(CSub)).run();
