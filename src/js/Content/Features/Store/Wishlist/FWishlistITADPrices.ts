import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Prices from "@Content/Modules/Prices/Prices";
import PriceOverview from "@Content/Modules/Prices/PriceOverview.svelte";
import Settings from "@Options/Data/Settings";
import type {TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";

export default class FWishlistITADPrices extends Feature<CWishlist> {

    private loader: Prices|undefined;
    private cached: Map<number, TPriceOverview|null> = new Map();

    private currentHoverNode: Element|null = null;
    private currentHoverAppid: number|null = null;
    private currentElement: PriceOverview|null = null;

    override checkPrerequisites(): boolean {
        return Settings.showlowestprice_onwishlist;
    }

    override apply(): void | Promise<void> {
        this.loader = new Prices(this.context.user);

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
            const {prices} = await this.loader!.load({apps: [appid]});
            this.cached.set(appid, prices.length > 0 ? prices[0]!.data : null);
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
