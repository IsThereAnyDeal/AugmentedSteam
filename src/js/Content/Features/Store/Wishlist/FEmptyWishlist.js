import {L} from "@Core/Localization/Localization";
import {__emptyWishlist_confirm, __emptyWishlist_removing, __emptyWishlist_title} from "@Strings/_strings";
import {HTML, SyncedStorage} from "../../../../modulesCore";
import {DynamicStore, Feature, RequestData, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FEmptyWishlist extends Feature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("showemptywishlist");
    }

    apply() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${L(__emptyWishlist_title)}</div>`);

        document.getElementById("es_empty_wishlist").addEventListener("click", async() => {

            await Page.runInPageContext(() => {
                const f = window.SteamFacade;
                const prompt = f.showConfirmDialog(L(__emptyWishlist_title), L(__emptyWishlist_confirm));

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            f.showBlockingWaitDialog(
                                L(__emptyWishlist_title),
                                L(__emptyWishlist_removing, {
                                    "cur": 1,
                                    "total": f.global("g_rgWishlistData").length
                                })
                            );
                            resolve();
                        }
                    });
                });
            }, [], true);

            const wishlistData = this.context.wishlistData;
            let cur = 1;
            const textNode = document.querySelector(".waiting_dialog_throbber").nextSibling;
            const url = "https://store.steampowered.com/api/removefromwishlist";

            for (const {appid} of wishlistData) {
                textNode.textContent = L(__emptyWishlist_removing, {
                    "cur": cur++,
                    "total": wishlistData.length
                });

                await RequestData.post(url, {"sessionid": User.sessionId, appid});
            }

            DynamicStore.clear();
            location.reload();
        });
    }
}
