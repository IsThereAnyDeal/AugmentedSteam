import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Prices from "@Content/Modules/Prices/Prices";
import PriceOverview from "@Content/Modules/Prices/PriceOverview.svelte";
import Settings from "@Options/Data/Settings";
import type {TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";

export default class FWishlistITADPrices extends Feature<CWishlist> {

    private loader: Prices|undefined;
    private cached: Map<number, TPriceOverview|null> = new Map();
    private chunks: Array<number[]> = [];
    private promises: Map<number, Promise<void>> = new Map();

    private currentHoverNode: Element|null = null;
    private currentHoverAppid: number|null = null;
    private currentElement: PriceOverview|null = null;

    override checkPrerequisites(): boolean {
        return Settings.showlowestprice_onwishlist;
    }

    override apply(): void | Promise<void> {
        this.loader = new Prices(this.context.user);

        const ChunkSize = 40;
        const appids = this.context.wishlistData.map(({appid})=> appid);
        this.chunks = [];
        for (let i=0; i<appids.length; i += ChunkSize) {
            this.chunks.push(appids.slice(i, i + ChunkSize));
        }

        document.body.addEventListener("mouseover", e => {
            const dom = this.context.dom;
            const node = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");

            if (this.currentHoverNode === node) {
                return;
            }
            this.currentHoverNode = node;

            if (!node) {
                this.currentHoverAppid = null;
                this.detachPrice();
                return;
            }

            const appid = dom.appid(dom.titleNode(node)!)!.number;
            if (appid === this.currentHoverAppid) {
                return;
            }

            this.currentHoverAppid = appid;
            this.attachPrice(node, appid);
        })
    }

    private async attachPrice(node: HTMLElement, appid: number): Promise<void> {
        if (!this.cached.has(appid)) {
            for (let i=0; i<this.chunks.length; i++) {
                const chunk = this.chunks[i]!;
                if (chunk.includes(appid)) {
                    let promise: Promise<void>|undefined = this.promises.get(i);

                    if (!promise) {
                        promise = (async () => {
                            const {prices} = await this.loader!.load({apps: chunk});
                            for (const {id, data} of prices) {
                                this.cached.set(id, data);
                            }
                            for (const appid of chunk) {
                                if (!this.cached.has(appid)) {
                                    this.cached.set(appid, null);
                                }
                            }
                        })();
                        this.promises.set(i, promise);
                    }
                    await promise;
                    break;
                }
            }

            if (appid !== this.currentHoverAppid) {
                return;
            }
        }

        this.detachPrice();
        const data = this.cached.get(appid);

        if (data && this.currentHoverAppid === appid) {
            // margin of game node
            const margin = window.getComputedStyle(node.querySelector(".LSY1zV2DJSM-")!).marginBottom;

            this.currentElement = new PriceOverview({
                target: node,
                props: {
                    data,
                    marginTop: `-${margin}`,
                    marginBottom: margin
                }
            });
        }
    }

    private detachPrice(): void {
        this.currentElement?.$destroy();
    }
}
