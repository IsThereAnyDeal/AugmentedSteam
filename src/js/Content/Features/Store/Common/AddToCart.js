import {Localization, SyncedStorage} from "../../../../modulesCore";
import {ConfirmDialog, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export class AddToCart {

    static async post(formEl, onWishlist, addToCartEl) {

        const cartUrl = "https://store.steampowered.com/cart/";
        const addToCartStr = Localization.str.addtocart_dialog;
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
                addToCartStr.error_desc,
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

        // Show feature hint to first time users
        if (!SyncedStorage.has("addtocart_no_redirect")) {

            enabled = await ConfirmDialog.openFeatureHint(
                addToCartStr.title,
                "addtocart_no_redirect",
                addToCartStr.desc,
                addToCartStr.continue,
                addToCartStr.checkout
            ) === "OK";

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
