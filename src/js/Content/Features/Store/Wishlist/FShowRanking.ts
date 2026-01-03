import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Rank from "@Content/Features/Store/Wishlist/Components/Rank.svelte";

export default class FShowRanking extends Feature<CWishlist> {

    private ranks: Map<number, number> = new Map();
    private components: Rank[] = [];

    override checkPrerequisites(): boolean {
        return this.context.isMyWishlist; // TODO add option
    }

    override apply(): void {
        // TODO update on reorder
        this.buildRankMap();
        this.context.onReorder.subscribe(() => this.handleUpdate());
        this.context.dom.onUpdate.subscribe(() => {
            this.addRanks();
        }, true);
    }

    private buildRankMap(): void {
        this.ranks = new Map(
            this.context.wishlistData?.map(
                item => [item.appid, item.priority]
            )
        );
    }

    private async handleUpdate(): Promise<void> {
        this.buildRankMap();
        this.addRanks();
    }

    private addRanks(): void {
        const dom = this.context.dom.dom;

        for (let game of dom.gameList?.games ?? []) {
            if (!game.appid) {
                continue;
            }
            const appid = game.appid!;

            const rankNode = game.node.querySelector<HTMLElement>(".as-rank");
            if (rankNode) {
                if (rankNode.dataset.appid == String(appid.number)) {
                    continue;
                } else {
                    rankNode.remove();
                }
            }

            const rank =  this.ranks.get(appid.number) ?? 0
            if (rank === 0) { continue; }

            const component = new Rank({
                target: game.node,
                props: {
                    appid: appid.number,
                    rank
                }
            });

            this.components.push(component);
        }

        let stillConnected: Rank[] = [];
        for (let component of this.components) {
            if (component.isConnected()) {
                stillConnected.push(component);
            } else {
                component.$destroy();
            }
        }
        this.components = stillConnected;
    }
}
