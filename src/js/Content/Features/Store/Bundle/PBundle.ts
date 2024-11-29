/**
 * @contentScript *://*.steampowered.com/bundle/*
 * @match *://*.steampowered.com/bundle/*
 */

import StorePage from "../../StorePage";
import CBundle from "./CBundle";

(new StorePage(CBundle)).run();
