
import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../core_modules";
import FExportWishlist from "./FExportWishlist";
import {Feature} from "../../../Modules/Content/Feature/Feature";
import {DynamicStore} from "../../../Modules/Content/Data/DynamicStore";
import {RequestData} from "../../../Modules/Content/RequestData";
import {User} from "../../../Modules/Content/User";

export default class FEmptyWishlist extends Feature {

    checkPrerequisites() {
        return this.context.myWishlist && SyncedStorage.get("showemptywishlist");
    }

    apply() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_empty_wishlist">${Localization.str.empty_wishlist.title}</div>`);

        document.getElementById("es_empty_wishlist").addEventListener("click", async() => {

            await this.context.runInPageContext(emptyWishlist => {
                /* eslint-disable no-undef, new-cap, camelcase */
                const prompt = ShowConfirmDialog(emptyWishlist.title, emptyWishlist.confirm);

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            ShowBlockingWaitDialog(
                                emptyWishlist.title,
                                emptyWishlist.removing
                                    .replace("__cur__", 1)
                                    .replace("__total__", g_rgWishlistData.length)
                            );
                            resolve();
                        }
                    });
                });
                /* eslint-enable no-undef, new-cap, camelcase */
            }, [Localization.str.empty_wishlist], true);

            const wishlistData = HTMLParser.getVariableFromDom("g_rgWishlistData", "array");
            if (!wishlistData) {
                console.warn("Failed to find wishlist data for this wishlist");
                return;
            }

            let cur = 1;
            const textNode = document.querySelector(".waiting_dialog_throbber").nextSibling;

            for (const {appid} of wishlistData) {
                textNode.textContent = Localization.str.empty_wishlist.removing
                    .replace("__cur__", cur++)
                    .replace("__total__", wishlistData.length);

                const formData = new FormData();
                formData.append("sessionid", User.sessionId);
                formData.append("appid", appid);

                const url = `https://store.steampowered.com/wishlist/profiles/${User.steamId}/remove/`;
                await RequestData.post(url, formData);
            }

            DynamicStore.clear();
            location.reload();
        });
    }
}

FEmptyWishlist.deps = [FExportWishlist];
