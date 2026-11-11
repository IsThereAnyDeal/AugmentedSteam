import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Price from "@Content/Modules/Currency/Price";
import SelectorMap from "@Content/SelectorMap";

export default class FWishlistRestorePriceCut extends Feature<CWishlist> {

    override async isEnabled(): Promise<boolean> {
        return Settings.restore_price_cut;
    }

    override async apply(): Promise<string|null> {
        this.context.dom.onUpdate.subscribe(() => {
            this.#checkPrices();
        }, true);

        return null;
    }

    #replace(cutIconNode: HTMLElement, cut: number): void {
        cutIconNode.classList.remove(SelectorMap.wishlist.prices.cutIconClass);

        const node = document.createElement("div");
        node.classList.add(SelectorMap.wishlist.prices.cutClass);
        node.innerText = `-${cut}%`;

        cutIconNode.replaceChildren(node);
    }

    #checkPrices(): void {
        const dom = this.context.dom.dom;

        for (let game of dom.gameList?.games ?? []) {
            const {normal, current, icon} = this.context.dom.priceNodes(game.node);
             if (!normal || !current || !icon) {
                 continue;
             }

            if (current.classList.contains(".as-restore")) {
                continue
            }
            current.classList.add(".as-restore");

            const normalPrice = Price.parseFromString(normal.innerText);
            const currentPrice = Price.parseFromString(current.innerText);

            if (normalPrice && currentPrice) {
                const cut = 100 - Math.round((currentPrice.value / normalPrice.value)*100);
                this.#replace(icon, cut);
            }
        }
    }
}
