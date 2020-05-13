class CWishlistPage extends CallbackContext {

    constructor() {
        super([
            FWishlistHighlights,
            FWishlistITADPrices,
        ]);

        if (!User.isSignedIn) {
            this.myWishlist = false;
        } else {
            let myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            let myWishlistUrlRegex = new RegExp("^" + myWishlistUrl + "([/#]|$)");
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes("/profiles/" + User.steamId);
        }

        this.applyFeatures();

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