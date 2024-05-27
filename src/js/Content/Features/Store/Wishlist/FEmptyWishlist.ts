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

export default class FEmptyWishlist extends Feature<CWishlist> {

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.showemptywishlist;
    }

    override apply(): void {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${L(__emptyWishlist_title)}</div>`);

        document.getElementById("es_empty_wishlist")!.addEventListener("click", async() => {

            const result = await SteamFacade.showConfirmDialog(L(__emptyWishlist_title), L(__emptyWishlist_confirm));
            if (result === "OK") {
                SteamFacade.showBlockingWaitDialog(
                    L(__emptyWishlist_title),
                    L(__emptyWishlist_removing, {
                        "cur": 1,
                        "total": (await SteamFacade.global<any[]>("g_rgWishlistData")).length
                    })
                );
            }

            const wishlistData = this.context.wishlistData;
            let cur = 1;
            const textNode = document.querySelector(".waiting_dialog_throbber")!.nextSibling!;
            const url = "https://store.steampowered.com/api/removefromwishlist";

            for (const {appid} of wishlistData) {
                textNode.textContent = L(__emptyWishlist_removing, {
                    "cur": cur++,
                    "total": wishlistData.length
                });

                await RequestData.post(url, {
                    sessionid: User.sessionId!,
                    appid: String(appid)
                });
            }

            DynamicStore.clear();
            location.reload();
        });
    }
}
