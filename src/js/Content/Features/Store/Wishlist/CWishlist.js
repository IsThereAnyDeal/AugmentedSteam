import {HTMLParser, TimeUtils} from "../../../../modulesCore";
import {ContextType, User} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FAddToCartNoRedirect from "../Common/FAddToCartNoRedirect";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FKeepEditableRanking from "./FKeepEditableRanking";
import FOneClickRemoveFromWishlist from "./FOneClickRemoveFromWishlist";
import FWishlistProfileLink from "./FWishlistProfileLink";

export class CWishlist extends CStoreBase {

    constructor() {

        const wishlistData = HTMLParser.getVariableFromDom("g_rgWishlistData", "array");

        // Don't apply features on empty or private wishlists
        if (!wishlistData || wishlistData.length === 0) {
            super(ContextType.WISHLIST);
            return;
        }

        super(ContextType.WISHLIST, [
            FAlternativeLinuxIcon,
            FAddToCartNoRedirect,
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FKeepEditableRanking,
            FOneClickRemoveFromWishlist,
            FWishlistProfileLink,
        ]);

        this.wishlistData = wishlistData;
        this.myWishlist = false;

        if (User.isSignedIn) {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        }

        // Maintain the order of the buttons
        FEmptyWishlist.dependencies = [FExportWishlist];
    }

    async applyFeatures() {
        if (this.features.length === 0) { return; }

        const throbber = document.getElementById("throbber");
        if (throbber && throbber.style.display !== "none") {
            await new Promise(resolve => {
                new MutationObserver((_, observer) => {
                    observer.disconnect();
                    resolve();
                }).observe(throbber, {"attributes": true});
            });
        }

        await super.applyFeatures();

        const alreadyLoaded = document.querySelectorAll(".wishlist_row");
        if (alreadyLoaded.length !== 0) {
            await this.triggerCallbacks(Array.from(alreadyLoaded));
        }

        this._registerObserver();
    }

    _registerObserver() {

        const container = document.getElementById("wishlist_ctn");
        let timer = null;
        const delayedWork = new Set();

        new MutationObserver(mutations => {

            for (const record of mutations) {
                if (record.addedNodes.length === 1) {
                    delayedWork.add(record.addedNodes[0]);
                }
            }

            if (timer === null) {

                timer = TimeUtils.resettableTimer(() => {

                    // Valve detaches wishlist entries that aren't visible
                    const arg = Array.from(delayedWork).filter(node => node.parentNode === container);
                    delayedWork.clear();

                    this.triggerCallbacks(arg);
                }, 50);
            } else {
                timer.reset();
            }
        }).observe(container, {"childList": true});
    }
}
