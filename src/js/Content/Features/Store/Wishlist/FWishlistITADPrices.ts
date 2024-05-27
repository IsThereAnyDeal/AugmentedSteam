import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Prices from "@Content/Modules/Prices/Prices";
import PriceOverview from "@Content/Modules/Prices/PriceOverview.svelte";
import Settings from "@Options/Data/Settings";

export default class FWishlistITADPrices extends Feature<CWishlist> {

    private _cachedPrices: Record<string, Promise<PriceOverview|null>|null> = {};
    private _activeEntry: [HTMLElement, PriceOverview|null]|null = null;

    override checkPrerequisites(): boolean {
        return Settings.showlowestprice_onwishlist;
    }

    override apply(): void | Promise<void> {
        window.addEventListener("scroll", () => this._scrollResizeHandler());
        window.addEventListener("resize", () => this._scrollResizeHandler());

        this.context.onWishlistUpdate.subscribe(e => this.callback(e.data));
    }

    private _scrollResizeHandler(): void {

        /*
         * If the mouse is still inside an entry while scrolling or resizing, wishlist.js's
         * event handler will put back the elements to their original position
         */
        if (this._activeEntry) {
            let [node, price] = this._activeEntry;
            this._updateNodesBelow(node, price?.height ?? 0);
        }
    }

    private callback(nodes: HTMLElement[]): void {
        const handler = new Prices();
        const cachedPrices = this._cachedPrices;

        for (const node of nodes) {

            const appId = node.dataset.appId;
            if (!appId || typeof cachedPrices[appId] !== "undefined") { return; }

            cachedPrices[appId] = null;

            node.addEventListener("mouseenter", () => {
                if (cachedPrices[appId] === null) {
                    cachedPrices[appId] = (async (): Promise<PriceOverview|null> => {
                        let {prices} = await handler.load({apps: [Number(appId)]});
                        if (prices.length === 0) {
                            return null;
                        }

                        const {id, data} = prices[0]!;
                        return new PriceOverview({
                            target: node,
                            props: {
                                data,
                                setBottom: true
                            }
                        });
                    })();
                }
                cachedPrices[appId]!.then(price => {
                    if (!price) { return; }
                    this._updateNodesBelow(node, price.height ?? 0);
                    this._activeEntry = [node, price];
                });
            });

            node.addEventListener("mouseleave", () => {

                // When scrolling really fast, sometimes only this event is called without the invocation of the mouseenter event
                if (cachedPrices[appId]) {
                    cachedPrices[appId]!.then(price => {
                        if (!price) { return; }
                        this._updateNodesBelow(node, -(price.height ?? 0));
                        this._activeEntry = null;
                    });
                }
            });
        }
    }

    private _updateNodesBelow(node: HTMLElement, height: number): void {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>(".wishlist_row"));

        /*
         * Limit the selection to the rows that are positioned below the row
         * (not including the row itself) where the price is being shown
         */
        nodes.filter(row => parseInt(row.style.top) > parseInt(node.style.top))
            .forEach(row => { row.style.top = `${parseInt(row.style.top) + height}px`; });
    }
}
