import {L} from "@Core/Localization/Localization";
import {__emptyWishlist_confirm, __emptyWishlist_removing, __emptyWishlist_title} from "@Strings/_strings";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import RequestData from "@Content/Modules/RequestData";
import User from "@Content/Modules/User";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";
import type {WishlistEntry} from "./CWishlist";

export default class EmptyWishlist {

    static async showDialog(wishlistData: WishlistEntry[]): Promise<void> {

        const result = await SteamFacade.showConfirmDialog(
            L(__emptyWishlist_title),
            L(__emptyWishlist_confirm), {
                explicitConfirm: true
            });

        if (result !== "OK") { return; }

        let cur = 0;

        const waitDialog = new BlockingWaitDialog(
            L(__emptyWishlist_title),
            () => L(__emptyWishlist_removing, {
                cur,
                total: wishlistData.length
            })
        );

        for (const {appid} of wishlistData) {
            ++cur;
            await waitDialog.update();
            await RequestData.post("https://store.steampowered.com/api/removefromwishlist", {
                sessionid: User.sessionId!,
                appid: String(appid)
            });
        }

        DynamicStore.clear();
        location.reload();
    }
}
