import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import UserNote from "@Content/Features/Store/Wishlist/Components/WishlistUserNote.svelte";

export default class FWishlistUserNotes extends Feature<CWishlist> {

    private notes: UserNotes|undefined;
    private components: UserNote[] = [];

    override checkPrerequisites(): boolean {
        return this.context.isMyWishlist && Settings.user_notes_wishlist;
    }

    override async apply(): Promise<void> {
        this.notes ??= new UserNotes();

        this.context.dom.onUpdate.subscribe(() => {
            this.addNotes();
        }, true);
    }

    private addNotes(): void {
        const dom = this.context.dom.dom;

        for (let game of dom.gameList?.games ?? []) {
            if (!game.title) {
                continue;
            }

            const appName = game.title.value!;
            const appid = game.appid!;

            const noteNode = game.node.querySelector<HTMLElement>(".as-note");
            if (noteNode) {
                if (noteNode.dataset.appid == String(appid.number)) {
                    continue;
                } else {
                    noteNode.remove();
                }
            }

            const platforms = game.platforms?.node;
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
