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

    private cur: number = 1;
    private textCtn: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        return this.context.myWishlist && Settings.showemptywishlist;
    }

    override apply(): void {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${L(__emptyWishlist_title)}</div>`);

        document.getElementById("es_empty_wishlist")!.addEventListener("click", async() => {

            const result = await SteamFacade.showConfirmDialog(L(__emptyWishlist_title), L(__emptyWishlist_confirm));
            if (result !== "OK") { return; }

            await SteamFacade.showBlockingWaitDialog(
                L(__emptyWishlist_title),
                `<div id="as_loading_text_ctn">${this.getStatusString()}</div>`
            );

            this.textCtn = document.querySelector("#as_loading_text_ctn")!;

            for (const {appid} of this.context.wishlistData) {

                await RequestData.post("https://store.steampowered.com/api/removefromwishlist", {
                    sessionid: User.sessionId!,
                    appid: String(appid)
                });

                this.cur++;
                this.textCtn.textContent = this.getStatusString();
            }

            DynamicStore.clear();
            location.reload();
        });
    }

    private getStatusString(): string {
        return L(__emptyWishlist_removing, {
            "cur": this.cur,
            "total": this.context.wishlistData.length
        });
    }
}
