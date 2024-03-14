/**
 * @contentScript
 * @match *://*.steampowered.com/agecheck/*
 */

import {StorePage} from "../../StorePage";
import {CAgeCheck} from "./CAgecheck";

(new StorePage()).run(CAgeCheck);
