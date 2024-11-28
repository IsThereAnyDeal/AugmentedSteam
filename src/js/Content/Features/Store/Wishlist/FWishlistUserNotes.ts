import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import UserNote from "@Content/Features/Store/Wishlist/Components/WishlistUserNote.svelte";

export default class FWishlistUserNotes extends Feature<CWishlist> {

    private notes: UserNotes|undefined;
    private components: UserNote[] = [];

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.user_notes_wishlist;
    }

    override async apply(): Promise<void> {
        this.notes ??= new UserNotes();

        this.context.dom.onChange(() => {
            this.addNotes();
        });
        this.addNotes();
    }

    private addNotes(): void {
        const dom = this.context.dom;

        for (let node of dom.gameNodes()) {
            const a = dom.titleNode(node);
            if (!a) {
                continue;
            }

            const appName = dom.title(a)!;
            const appid = dom.appid(a);

            const noteNode = node.querySelector<HTMLElement>(".as-note");
            if (noteNode) {
                if (noteNode.dataset.appid == String(appid.number)) {
                    continue;
                } else {
                    noteNode.remove();
                }
            }

            const platforms = dom.platformsNode(node);
            if (!platforms || platforms.childElementCount === 0) {
                continue;
            }

            const component = new UserNote({
                target: platforms,
                props: {
                    notes: this.notes!,
                    appName,
                    appid: appid.number
                }
            });

            this.components.push(component);
        }

        let stillConnected: UserNote[] = [];
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
