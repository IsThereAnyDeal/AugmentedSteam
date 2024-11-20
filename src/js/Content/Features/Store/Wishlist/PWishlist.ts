/**
 * @contentScripts
 * @match *://*.steampowered.com/wishlist/(id|profiles)/*
 */

import StorePage from "../../StorePage";
import CWishlist from "./CWishlist";

(new StorePage(CWishlist)).run();
