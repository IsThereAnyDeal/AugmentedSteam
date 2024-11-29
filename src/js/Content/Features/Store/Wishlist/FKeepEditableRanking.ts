import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import RankInput from "@Content/Features/Store/Wishlist/Components/RankInput.svelte";

export default class FKeepEditableRanking extends Feature<CWishlist> {

    private inputComponents: RankInput[] = [];
    private positions: Map<number, number> = new Map;

    override checkPrerequisites(): boolean {
        return this.context.myWishlist;
    }

    override apply(): void {
        this.computePositions();
        this.context.dom.onChange(() => this.addInputs());
        this.context.onReorder.subscribe(() => this.handleUpdate());
        this.addInputs();
    }

    private computePositions(): void {
        this.positions = new Map(
            this.context.wishlistData?.map(
                item => [item.appid, item.priority]
            )
        );
    }

    private async handleUpdate(): Promise<void> {
        this.computePositions();
        for(let component of this.inputComponents) {
            component.position = this.positions.get(component.appid);
        }
        this.addInputs();
    }

    private async handleReposition(e: CustomEvent<{appid: number, position: number}>): Promise<void> {
        const {appid, position} = e.detail;

        let data = structuredClone(this.context.wishlistData!)
            .sort((a, b) => a.priority - b.priority);
        const index = data.findIndex(item => item.appid === appid);
        if (!index) {
            throw new Error("Couldn't find item");
        }

        const item = data.splice(index, 1)[0]!;
        data.splice(position-1, 0, item);

        const newPositions = [];
        let p = 1;
        for (let item of data) {
            if (item.priority !== p) {
                newPositions.push({
                    appid: item.appid,
                    priority: p
                });
            }
            p++;
        }

        await fetch("https://store.steampowered.com/wishlist/action/reorder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                rgApps: newPositions
            })
        });
        // TODO check result?
    }

    private addInputs(): void {
        const dom = this.context.dom;

        for (const node of dom.gameNodes()) {
            const titleNode = dom.titleNode(node);
            if (!titleNode) {
                continue;
            }

            const inputNode = node.querySelector<HTMLInputElement>("input[type='text']");
            const appid = dom.appid(titleNode).number;

            if (inputNode) {
                if (!inputNode.dataset.appid) {
                    // native input
                    continue;
                }

                if (inputNode.dataset.appid === String(appid)) {
                    continue;
                } else {
                    inputNode.parentElement!.remove();
                }
            }

            const component = new RankInput({
                target: node,
                anchor: node.firstElementChild!,
                props: {
                    appid,
                    position: this.positions.get(appid)
                }
            });
            component.$on("reposition", e => this.handleReposition(e));

            this.inputComponents.push(component);
        }

        this.inputComponents = this.inputComponents.filter(c => {
            const connected = c.isConnected();
            if (!connected) {
                c.$destroy();
            }
            return connected;
        })
    }
}
