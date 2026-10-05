/**
 * @contentScript
 * @match *://*.steampowered.com/sub/*
 */

import StorePage from "../StorePage";
import CSub from "../../Features/Store/Sub/CSub";

(new StorePage(CSub)).run();
