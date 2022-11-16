import {Localization, SyncedStorage} from "../../../../modulesCore";
import {RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export class AddToCart {

    static async post(formEl, onWishlist, addToCartEl) {

        const cartUrl = "https://store.steampowered.com/cart/";
        let response;

        try {
            response = await RequestData.post(cartUrl, new FormData(formEl), {}, "none");
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

        // If redirected to a page other than the cart, follow the redirect
        if (response.url !== cartUrl) {
            window.location.assign(response.url);
            return;
        }

        let enabled = SyncedStorage.get("addtocart_no_redirect");

        // Show a confirm dialog to first time users asking if they want to enabled this feature
        if (!SyncedStorage.has("addtocart_no_redirect")) {
            enabled = await Page.runInPageContext((str) => new Promise((resolve) => {
                // https://github.com/SteamDatabase/SteamTracking/blob/48f469eb6f296cc551fac7c96bbb9dfa7e987809/store.steampowered.com/public/javascript/itemstore.js#L43
                window.SteamFacade.showConfirmDialog(str.title, `${str.desc}<br><br>${str.desc_feature}`, str.continue, str.checkout)
                    .done(() => {
                        resolve(true);
                    })
                    .fail(() => {
                        resolve(false);
                    });
            }), [Localization.str.addtocart_dialog], true);

            SyncedStorage.set("addtocart_no_redirect", enabled);
        }

        // If the dialog is closed or canceled, don't enable feature
        if (!enabled) {
            window.location.assign(cartUrl);
            return;
        }

        if (onWishlist) {
            // Note: Steam may not keep button status after reloading
            addToCartEl.setAttribute("href", cartUrl);
            addToCartEl.querySelector("span").textContent = Localization.str.in_cart;

            // Show the cart button and update item count
            document.getElementById("store_header_cart_btn").style.display = "block";
            const itemCount = document.getElementById("cart_item_count_value");
            itemCount.textContent = Number(itemCount.textContent) + 1;
        } else {
            // On store pages, reload so page elements are updated
            window.location.reload();
        }
    }
}
