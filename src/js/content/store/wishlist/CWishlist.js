import {CStoreBaseCallback} from "store/common/CStoreBaseCallback";
import {ContextTypes} from "modules";

import {FWishlistHighlights} from "store/wishlist/FWishlistHighlights";
import {FWishlistITADPrices} from "store/wishlist/FWishlistITADPrices";
import {FWishlistUserNotes} from "store/wishlist/FWishlistUserNotes";
import {FWishlistStats} from "store/wishlist/FWishlistStats";
import {FEmptyWishlist} from "store/wishlist/FEmptyWishlist";
import {FExportWishlist} from "store/wishlist/FExportWishlist";
import {FAlternativeLinuxIcon} from "store/common/FAlternativeLinuxIcon";

import {ExtensionLayer, User} from "common";

export class CWishlist extends CStoreBaseCallback {

    constructor() {
        super([
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FAlternativeLinuxIcon,
        ]);

        this.type = ContextTypes.WISHLIST;

        if (!User.isSignedIn) {
            this.myWishlist = false;
        } else {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        }

        this._registerObserver();
    }

    async applyFeatures() {
        if (document.querySelector("#throbber").style.display !== "none") {
            await ExtensionLayer.runInPageContext(() => new Promise(resolve => {
                $J(document).ajaxSuccess((e, xhr, settings) => {
                    const url = new URL(settings.url);
                    if (url.origin + url.pathname === `${g_strWishlistBaseURL}wishlistdata/` && g_Wishlist.nPagesToLoad === g_Wishlist.nPagesLoaded) {
                        resolve();
                    }
                });
            }), null, true);
        }

        super.applyFeatures();
    }

    _registerObserver() {

        const container = document.getElementById("wishlist_ctn");
        let timeout = null,
            lastRequest = null;
        const delayedWork = new Set();

        new MutationObserver(mutations => {

            for (const record of mutations) {
                if (record.addedNodes.length === 1) {
                    delayedWork.add(record.addedNodes[0]);
                }
            }

            lastRequest = window.performance.now();

            if (timeout === null) {

                const that = this;

                timeout = window.setTimeout(async function markWishlist() {
                    if (window.performance.now() - lastRequest < 40) {
                        timeout = window.setTimeout(markWishlist, 50);
                        return;
                    }

                    timeout = null;

                    if (that._callbacks.length === 0) {

                        // Wait until the callbacks have registered
                        return;
                    }

                    // Valve detaches wishlist entries that aren't visible
                    const arg = Array.from(delayedWork).filter(node => node.parentNode === container);
                    delayedWork.clear();

                    that.triggerCallbacks(arg);

                    window.dispatchEvent(new Event("resize"));
                }, 50);
            }
        }).observe(container, {"childList": true});
    }
}
