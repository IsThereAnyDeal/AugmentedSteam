import {L} from "@Core/Localization/Localization";
import {__emptyWishlist_confirm, __emptyWishlist_removing, __emptyWishlist_title} from "@Strings/_strings";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import RequestData from "@Content/Modules/RequestData";
import User from "@Content/Modules/User";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";

export default class FEmptyWishlist extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.showemptywishlist;
    }

    override apply(): void {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${L(__emptyWishlist_title)}</div>`);

        document.getElementById("es_empty_wishlist")!.addEventListener("click", async() => {

            const result = await SteamFacade.showConfirmDialog(L(__emptyWishlist_title), L(__emptyWishlist_confirm));
            if (result !== "OK") { return; }

            let cur = 0;
            const wishlistData = this.context.wishlistData;

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
        });
    }
}
