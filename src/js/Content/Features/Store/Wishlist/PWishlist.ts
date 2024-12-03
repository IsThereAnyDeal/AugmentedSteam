/**
 * @contentScripts
 * @match *://*.steampowered.com/wishlist
 * @match *://*.steampowered.com/wishlist/(id|profiles)/*
 */

import CWishlist from "./CWishlist";
import ReactPage from "@Content/Features/ReactPage";

(new ReactPage(CWishlist))
    .hydration()
    .then(page => page.run());
