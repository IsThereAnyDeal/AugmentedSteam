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
import ConfirmDialog from "@Core/Modals/ConfirmDialog";
import {EModalAction} from "@Core/Modals/Contained/EModalAction";
import ServiceFactory from "@Protobufs/ServiceFactory";

export default class FEmptyWishlist extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.isMyWishlist && Settings.showemptywishlist;
    }

    override apply(): void {

        const button = new WishlistButton({
            target: getMenuNode().getTarget(1),
            props: {
                label: L(__emptyWishlist_title),
                destructive: true
            }
        });
        button.$on("click", () => {
            this.handleClick()
        });
    }

    private async handleClick(): Promise<void> {

        const confirm = new ConfirmDialog(
            L(__emptyWishlist_title),
            L(__emptyWishlist_confirm), {
                primary: L(__ok),
                cancel: L(__cancel)
            }
        );

        const response = await confirm.show();
        if (response !== EModalAction.OK) {
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
