import {ContextType, User} from "../../../modulesContent";
import {CStoreBase} from "../Common/CStoreBase";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FOneClickRemoveFromWishlist from "./FOneClickRemoveFromWishlist";
import {TimeUtils} from "../../../../modulesCore";

export class CWishlist extends CStoreBase {

    constructor() {
        // Don't apply features on empty or private wishlists
        if (document.getElementById("nothing_to_see_here").style.display !== "none") {
            super(ContextType.WISHLIST);
            return;
        }

        super(ContextType.WISHLIST, [
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FOneClickRemoveFromWishlist,
            FAlternativeLinuxIcon,
        ]);

        if (User.isSignedIn) {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        } else {
            this.myWishlist = false;
        }
    }

    async applyFeatures() {
        const throbber = document.getElementById("throbber");
        if (throbber.style.display !== "none") {
            await new Promise(resolve => {
                new MutationObserver((mutations, observer) => {
                    observer.disconnect();
                    resolve();
                }).observe(throbber, {"attributes": true});
            });
        }

        await super.applyFeatures();

        const alreadyLoaded = document.querySelectorAll(".wishlist_row");
        if (alreadyLoaded.length !== 0) {
            this.triggerCallbacks(alreadyLoaded);

            window.dispatchEvent(new Event("resize"));
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

                    window.dispatchEvent(new Event("resize"));
                }, 50);
            } else {
                timer.reset();
            }
        }).observe(container, {"childList": true});
    }
}
