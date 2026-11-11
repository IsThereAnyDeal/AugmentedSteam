import Feature from "@Content/Modules/Context/Feature";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
import UserNote from "@Content/Features/Store/Wishlist/Components/WishlistUserNote.svelte";
import {mount, tick, unmount} from "svelte";

export default class FWishlistUserNotes extends Feature<CWishlist> {

    #notes: UserNotes|undefined;
    #components: UserNote[] = [];

    override async isEnabled(): Promise<boolean> {
        return this.context.isMyWishlist && Settings.user_notes_wishlist;
    }

    override async apply(): Promise<string|null> {
        this.#notes ??= new UserNotes();

        this.context.dom.onUpdate.subscribe(() => {
            this.#addNotes();
        }, true);

        return null;
    }

    async #addNotes(): Promise<void> {
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

            const targetNode = game.categories;
            if (!targetNode) {
                continue;
            }

            this.#components.push(
                mount(UserNote, {
                    target: targetNode,
                    props: {
                        notes: this.#notes!,
                        appName,
                        appid: appid.number
                    }
                })
            );
        }

        await tick();
        let stillConnected: UserNote[] = [];
        for (let component of this.#components) {
            if (component.isConnected()) {
                stillConnected.push(component);
            } else {
                unmount(component);
            }
        }
        this.#components = stillConnected;
    }
}
