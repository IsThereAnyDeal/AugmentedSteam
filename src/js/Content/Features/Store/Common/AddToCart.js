import {Localization, SyncedStorage} from "../../../../modulesCore";
import {RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export class AddToCart {

    static async post(form) {

        let response;

        try {
            response = await RequestData.post("https://store.steampowered.com/cart/", new FormData(form), {}, "none");
        } catch (err) {
            // Likely network error; response.ok doesn't mean the item was added successfully
            Page.runInPageContext((errTitle, errDesc, errStr) => {
                window.SteamFacade.showAlertDialog(errTitle, `${errDesc}<br><br>${errStr}`);
            },
            [
                Localization.str.error,
                Localization.str.addtocart_dialog.error_desc,
                err.toString()
            ]);

            return;
        }

        /*
         * Show dialog if redirected to cart, otherwise follow the redirect
         * Dialog description copied from `AddMtxItemToCart` in itemstore.js
         * https://github.com/SteamDatabase/SteamTracking/blob/master/store.steampowered.com/public/javascript/itemstore.js#L43
         */
        if (response.url === "https://store.steampowered.com/cart/") {

            let enabled = SyncedStorage.get("addtocart_no_redirect");

            // Show dialog to first time users
            if (!SyncedStorage.has("addtocart_no_redirect")) {
                enabled = await Page.runInPageContext(({title, desc, "continue": cont, checkout}) => new Promise((resolve) => {
                    window.SteamFacade.showConfirmDialog(title, `${desc.added_to_cart}<br><br>${desc.enable_feature}`, cont, checkout)
                        .done(() => {
                            resolve(true);
                        })
                        .fail(() => {
                            resolve(false);
                        });
                }), [Localization.str.addtocart_dialog], true);

                SyncedStorage.set("addtocart_no_redirect", enabled);
            }

            if (enabled) {
                if (window.location.pathname.startsWith("/wishlist/")) {
                    // Show cart button and update number of items
                    document.getElementById("store_header_cart_btn").style.display = "block";
                    const oldCount = document.getElementById("cart_item_count_value").textContent;
                    document.getElementById("cart_item_count_value").textContent = Number(oldCount) + 1;
                } else {
                    // Reload on store pages so page elements are updated
                    window.location.reload();
                }
            } else {
                // If the dialog is closed or canceled, don't enable feature
                window.location.assign("https://store.steampowered.com/cart/");
            }
        } else {
            window.location.assign(response.url);
        }
    }
}
