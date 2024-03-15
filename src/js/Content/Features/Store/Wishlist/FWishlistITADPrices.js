import {SyncedStorage} from "../../../../modulesCore";
import PriceOverview from "../../../Modules/Prices/PriceOverview.svelte";
import {CallbackFeature, Prices} from "../../../modulesContent";

export default class FWishlistITADPrices extends CallbackFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showlowestprice_onwishlist");
    }

    setup() {
        this._cachedPrices = {};
        this._activeEntry = null;

        window.addEventListener("scroll", () => { this._scrollResizeHandler(); });
        window.addEventListener("resize", () => { this._scrollResizeHandler(); });
    }

    _scrollResizeHandler() {

        /*
         * If the mouse is still inside an entry while scrolling or resizing, wishlist.js's
         * event handler will put back the elements to their original position
         */
        if (this._activeEntry) {
            let [node, price] = this._activeEntry;
            this._updateNodesBelow(node, price.height);
        }
    }

    callback(nodes) {
        const handler = new Prices();
        const cachedPrices = this._cachedPrices;

        for (const node of nodes) {

            const appId = node.dataset.appId;
            if (!appId || typeof cachedPrices[appId] !== "undefined") { return; }

            cachedPrices[appId] = null;

            node.addEventListener("mouseenter", () => {
                if (cachedPrices[appId] === null) {
                    cachedPrices[appId] = (async () => {
                        let {prices} = await handler.load({apps: [Number(appId)]});
                        if (prices.length === 0) {
                            return null;
                        }

                        const {id, data} = prices[0];
                        return new PriceOverview({
                            target: node,
                            props: {
                                data,
                                setBottom: true
                            }
                        });
                    })();
                }
                cachedPrices[appId].then(price => {
                    if (!price) { return; }
                    this._updateNodesBelow(node, price.height);
                    this._activeEntry = [node, price];
                });
            });

            node.addEventListener("mouseleave", () => {

                // When scrolling really fast, sometimes only this event is called without the invocation of the mouseenter event
                if (cachedPrices[appId]) {
                    cachedPrices[appId].then(price => {
                        if (!price) { return; }
                        this._updateNodesBelow(node, -price.height);
                        this._activeEntry = null;
                    });
                }
            });
        }
    }

    _updateNodesBelow(node, height) {
        const nodes = Array.from(document.querySelectorAll(".wishlist_row"));

        /*
         * Limit the selection to the rows that are positioned below the row
         * (not including the row itself) where the price is being shown
         */
        nodes.filter(row => parseInt(row.style.top) > parseInt(node.style.top))
            .forEach(row => { row.style.top = `${parseInt(row.style.top) + height}px`; });
    }
}
