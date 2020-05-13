class CWishlistPage extends CallbackContext {

    constructor() {
        super([
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
        ]);

        if (!User.isSignedIn) {
            this.myWishlist = false;
        } else {
            let myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            let myWishlistUrlRegex = new RegExp("^" + myWishlistUrl + "([/#]|$)");
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes("/profiles/" + User.steamId);
        }

        this._registerObserver();

        if (document.querySelector("#throbber").style.display === "none") {
            this.applyFeatures();
        } else {
            ExtensionLayer.runInPageContext(() => new Promise(resolve => {
                $J(document).ajaxSuccess((e, xhr, settings) => {
                    let url = new URL(settings.url);
                    if (url.origin + url.pathname === `${g_strWishlistBaseURL}wishlistdata/` && g_Wishlist.nPagesToLoad === g_Wishlist.nPagesLoaded) {
                        resolve();
                    }
                });
            }), null, true)
            .then(() => { this.applyFeatures(); });
        }        
    }

    _registerObserver() {

        let container = document.getElementById("wishlist_ctn");
        let timeout = null, lastRequest = null;
        let delayedWork = new Set();

        new MutationObserver(mutations => {

            for (let record of mutations) {
                if (record.addedNodes.length === 1) {
                    delayedWork.add(record.addedNodes[0]);
                }
            }
            
            lastRequest = window.performance.now();

            if (timeout === null) {

                let that = this;

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
                    let arg = Array.from(delayedWork).filter(node => node.parentNode === container);
                    delayedWork.clear();

                    that.triggerCallbacks(arg);

                    window.dispatchEvent(new Event("resize"));
                }, 50);
            }
        }).observe(container, { "childList": true, });
    }
}