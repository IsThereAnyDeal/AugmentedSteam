/**
 * @contentScripts
 * @match *://*.steampowered.com/wishlist
 * @match *://*.steampowered.com/wishlist/(id|profiles)/*
 * @match *://*.steampowered.com//wishlist
 * @match *://*.steampowered.com//wishlist/(id|profiles)/*
 */

import CWishlist from "../../Features/Store/Wishlist/CWishlist";
import ReactPage from "@Content/Pages/ReactPage";

(new ReactPage(CWishlist))
    .hydration()
    .then(page => page.run());
