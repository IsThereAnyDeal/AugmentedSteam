import {L} from "@Core/Localization/Localization";
import {
    __cancel,
    __emptyWishlist_confirm,
    __emptyWishlist_removing,
    __emptyWishlist_title,
    __ok
} from "@Strings/_strings";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";
import WishlistButton from "@Content/Features/Store/Wishlist/Components/WishlistButton.svelte";
import {getMenuNode} from "@Content/Features/Store/Wishlist/Components/WishlistMenu";
import ServiceFactory from "@Protobufs/ServiceFactory";
import {mount, unmount} from "svelte";
import Modal from "@Core/Modals/Contained/Modal.svelte";

export default class FEmptyWishlist extends Feature<CWishlist> {

    override async isEnabled(): Promise<boolean> {
        return Settings.showemptywishlist;
    }

    override async apply(): Promise<string|null> {
        if (!this.context.isMyWishlist) {
            return null;
        }

        mount(WishlistButton, {
            target: await getMenuNode().getTarget(1),
            props: {
                label: L(__emptyWishlist_title),
                destructive: true,
                onclick: () => this.#handleClick()
            }
        });
        return null;
    }

    async #handleClick(): Promise<void> {

        const confirm = new Promise<boolean>((resolve) => {
            const modal = mount(Modal, {
                target: document.body,
                props: {
                    title: L(__emptyWishlist_title),
                    body: L(__emptyWishlist_confirm),
                    buttons: {
                        primary: L(__ok),
                        cancel: L(__cancel)
                    },
                    onprimary: () => {
                        resolve(true);
                        unmount(modal);
                    },
                    oncancel: () => {
                        resolve(false);
                        unmount(modal);
                    }
                }
            });
        })

        if (!await confirm) {
            return;
        }

        let cur = 0;
        const wishlistData = this.context.wishlistData ?? [];

        const waitDialog = new BlockingWaitDialog(
            L(__emptyWishlist_title),
            () => L(__emptyWishlist_removing, {
                cur,
                total: wishlistData.length
            })
        );

        const service = ServiceFactory.WishlistService(this.context.user);

        for (const {appid} of wishlistData) {
            ++cur;
            await waitDialog.update();
            await service.removeFromWishlist({appid});
        }

        DynamicStore.clear();
        location.reload();
    }
}
