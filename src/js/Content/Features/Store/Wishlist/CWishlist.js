import {ContextType, User} from "../../../modulesContent";
import {CStoreBaseCallback} from "../Common/CStoreBaseCallback";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import {Page} from "../../Page";
import {TimeUtils} from "../../../../modulesCore";

export class CWishlist extends CStoreBaseCallback {

    constructor() {
        super(ContextType.WISHLIST, [
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FAlternativeLinuxIcon,
        ]);

        if (User.isSignedIn) {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        } else {
            this.myWishlist = false;
        }

        this._registerObserver();
    }

    async applyFeatures() {
        if (document.querySelector("#throbber").style.display !== "none") {
            await Page.runInPageContext(() => new Promise(resolve => {
                /* eslint-disable no-undef, camelcase */
                $J(document).ajaxSuccess((e, xhr, settings) => {
                    const url = new URL(settings.url);
                    if (url.origin + url.pathname === `${g_strWishlistBaseURL}wishlistdata/` && g_Wishlist.nPagesToLoad === g_Wishlist.nPagesLoaded) {
                        resolve();
                    }
                });
                /* eslint-enable no-undef, camelcase */
            }), null, true);
        }

        super.applyFeatures();
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

                    if (this._callbacks.length === 0) {

                        // Wait until the callbacks have registered
                        return;
                    }

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
