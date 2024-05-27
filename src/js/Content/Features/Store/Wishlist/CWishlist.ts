import HTMLParser from "@Core/Html/HtmlParser";
import TimeUtils from "@Core/Utils/TimeUtils";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FKeepEditableRanking from "./FKeepEditableRanking";
import FOneClickRemoveFromWishlist from "./FOneClickRemoveFromWishlist";
import FWishlistProfileLink from "./FWishlistProfileLink";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import {ContextType} from "@Content/Modules/Context/ContextType";
import User from "@Content/Modules/User";
import ASEventHandler from "@Content/Modules/ASEventHandler";

interface WishlistEntry {
    appid: number,
    priority: number,
    added: number
}

export default class CWishlist extends CStoreBase {

    public readonly onWishlistUpdate: ASEventHandler<HTMLElement[]> = new ASEventHandler<HTMLElement[]>();

    public readonly wishlistData: WishlistEntry[] = [];
    public readonly myWishlist: boolean = false;

    constructor() {
        const wishlistData = HTMLParser.getArrayVariable<WishlistEntry>("g_rgWishlistData") ?? [];

        const hasWishlistData = wishlistData && wishlistData.length > 0;

        super(ContextType.WISHLIST, hasWishlistData
            ? [
                FAlternativeLinuxIcon,
                FWishlistHighlights,
                FWishlistITADPrices,
                FWishlistUserNotes,
                FWishlistStats,
                FEmptyWishlist,
                FExportWishlist,
                FKeepEditableRanking,
                FOneClickRemoveFromWishlist,
                FWishlistProfileLink,
            ] : []
        );

        if (!hasWishlistData) {
            return;
        }

        this.wishlistData = wishlistData;
        this.myWishlist = false;

        if (User.isSignedIn) {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        }

        // Maintain the order of the buttons
        this.dependency(FEmptyWishlist, [FExportWishlist, true]);
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

        // Internal property to track which nodes have already been processed
        const done = Symbol("done");

        const alreadyLoaded = Array.from(document.querySelectorAll(".wishlist_row"));
        if (alreadyLoaded.length !== 0) {
            await this.triggerCallbacks(alreadyLoaded, done);
        }

        let timer = null;
        const delayedWork = new Set();

        new MutationObserver(mutations => {

            for (const {addedNodes} of mutations) {
                const node = addedNodes[0];
                if (node && !node[done]) {
                    delayedWork.add(node);
                }
            }

            if (timer === null) {

                timer = TimeUtils.resettableTimer(() => {

                    // Valve detaches wishlist entries that aren't visible
                    const visibleRows = Array.from(delayedWork).filter(node => node.isConnected);
                    delayedWork.clear();

                    if (visibleRows.length !== 0) {
                        this.triggerCallbacks(visibleRows, done);
                    }
                }, 50);
            } else {
                timer.reset();
            }
        }).observe(document.getElementById("wishlist_ctn"), {"childList": true});
    }

    triggerCallbacks(nodes, done) {
        nodes.forEach(node => { node[done] = true; });
        return super.triggerCallbacks(nodes);
    }
}
