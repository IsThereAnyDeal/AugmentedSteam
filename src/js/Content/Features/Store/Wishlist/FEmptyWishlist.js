import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {DynamicStore, Feature, RequestData, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FEmptyWishlist extends Feature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("showemptywishlist");
    }

    apply() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${Localization.str.empty_wishlist.title}</div>`);

        document.getElementById("es_empty_wishlist").addEventListener("click", async() => {

            await Page.runInPageContext(emptyWishlist => {
                const f = window.SteamFacade;
                const prompt = f.showConfirmDialog(emptyWishlist.title, emptyWishlist.confirm);

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            f.showBlockingWaitDialog(
                                emptyWishlist.title,
                                emptyWishlist.removing
                                    .replace("__cur__", 1)
                                    .replace("__total__", f.global("g_rgWishlistData").length)
                            );
                            resolve();
                        }
                    });
                });
            }, [Localization.str.empty_wishlist], true);

            const wishlistData = this.context.wishlistData;
            let cur = 1;
            const textNode = document.querySelector(".waiting_dialog_throbber").nextSibling;
            const url = "https://store.steampowered.com/api/removefromwishlist";

            for (const {appid} of wishlistData) {
                textNode.textContent = Localization.str.empty_wishlist.removing
                    .replace("__cur__", cur++)
                    .replace("__total__", wishlistData.length);

                const formData = new FormData();
                formData.append("sessionid", User.sessionId);
                formData.append("appid", appid);

                await RequestData.post(url, formData);
            }

            DynamicStore.clear();
            location.reload();
        });
    }
}
