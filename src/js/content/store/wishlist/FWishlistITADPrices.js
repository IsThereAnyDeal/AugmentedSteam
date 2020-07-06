import {CallbackFeature} from "modules/CallbackFeature";

import {SyncedStorage} from "core";
import {ExtensionLayer, Prices} from "common";

export class FWishlistITADPrices extends CallbackFeature {

    constructor(context) {
        super(context);

        this._cachedPrices = {};
    }

    checkPrerequisites() {
        return SyncedStorage.get("showlowestprice_onwishlist");
    }

    apply() {

        ExtensionLayer.runInPageContext(() => {
            function getNodesBelow(node) {
                const nodes = Array.from(document.querySelectorAll(".wishlist_row"));

                // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
                return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
            }

            const oldOnScroll = CWishlistController.prototype.OnScroll;

            CWishlistController.prototype.OnScroll = function() {
                oldOnScroll.call(g_Wishlist);

                // If the mouse is still inside an entry while scrolling or resizing, wishlist.js's event handler will put back the elements to their original position
                const hover = document.querySelectorAll(":hover");
                if (hover.length) {
                    const activeEntry = hover[hover.length - 1].closest(".wishlist_row");
                    if (activeEntry) {
                        const priceNode = activeEntry.querySelector(".itad-pricing");

                        if (priceNode) {
                            for (const row of getNodesBelow(activeEntry)) {
                                row.style.top = `${parseInt(row.style.top) + priceNode.getBoundingClientRect().height}px`;
                            }
                        }
                    }
                }
            };

        });

        super.apply();
    }

    callback(nodes) {

        const cachedPrices = this._cachedPrices;

        for (const node of nodes) {

            const appId = node.dataset.appId;
            if (!appId || typeof cachedPrices[appId] !== "undefined") { return; }

            cachedPrices[appId] = null;

            node.addEventListener("mouseenter", () => {
                if (cachedPrices[appId] === null) {
                    cachedPrices[appId] = new Promise(resolve => {
                        const prices = new Prices();
                        prices.appids = [appId];
                        prices.priceCallback = (type, id, contentNode) => {
                            node.insertAdjacentElement("beforeend", contentNode);
                            const priceNode = node.querySelector(".itad-pricing");
                            priceNode.style.bottom = `${-priceNode.getBoundingClientRect().height}px`;
                            resolve();
                        };
                        prices.load();
                    });
                }
                cachedPrices[appId].then(() => {
                    const priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                    this._getNodesBelow(node).forEach(row => row.style.top = `${parseInt(row.style.top, 10) + priceNodeHeight}px`);
                });
            });

            node.addEventListener("mouseleave", () => {

                // When scrolling really fast, sometimes only this event is called without the invocation of the mouseenter event
                if (cachedPrices[appId]) {
                    cachedPrices[appId].then(() => {
                        const priceNodeHeight = node.querySelector(".itad-pricing").getBoundingClientRect().height;
                        this._getNodesBelow(node).forEach(row => row.style.top = `${parseInt(row.style.top, 10) - priceNodeHeight}px`);
                    });
                }
            });
        }
    }

    _getNodesBelow(node) {
        const nodes = Array.from(document.querySelectorAll(".wishlist_row"));

        // Limit the selection to the rows that are positioned below the row (not including the row itself) where the price is being shown
        return nodes.filter(row => parseInt(row.style.top, 10) > parseInt(node.style.top, 10));
    }
}
