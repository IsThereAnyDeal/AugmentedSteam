import {Localization, SyncedStorage} from "../../../../modulesCore";
import {ConfirmDialog, RequestData} from "../../../modulesContent";
import {Page} from "../../Page";

export class AddToCart {

    static async checkFeatureHint() {
        let enabled = SyncedStorage.get("addtocart_no_redirect");

        // Show feature hint to first time users
        if (!SyncedStorage.has("addtocart_no_redirect")) {
            const addToCartStr = Localization.str.addtocart_dialog;

            // If the dialog is closed or canceled, don't enable feature
            enabled = await ConfirmDialog.openFeatureHint(
                "addtocart_no_redirect",
                addToCartStr.title,
                addToCartStr.desc,
                addToCartStr.continue,
                addToCartStr.checkout
            ) === "OK";

            SyncedStorage.set("addtocart_no_redirect", enabled);
        }

        return enabled;
    }

    static async post(formEl, onWishlist, addToCartEl) {

        // Use the form's `action` here because free promotions are submitted to a different endpoint
        const endpoint = formEl.getAttribute("action");

        if (endpoint.includes("freelicense/")) {
            this._addFreePromotion(endpoint, formEl, onWishlist, addToCartEl);
            return;
        }

        let response;

        try {
            response = await RequestData.post(endpoint, new FormData(formEl), {}, false);
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

        /**
         * If redirected to a page other than the cart, follow the redirect.
         * E.g. CSGO operations redirect to a /approvetxn/ page.
         */
        const url = new URL(response.url);
        if (!/^\/cart\/?$/.test(url.pathname)) {
            window.location.assign(response.url);
            return;
        }

        if (onWishlist) {
            addToCartEl.setAttribute("href", "https://store.steampowered.com/cart/");
            addToCartEl.querySelector("span").textContent = Localization.str.in_cart;

            // Show the cart button and update item count
            document.getElementById("store_header_cart_btn").style.display = "block";
            const itemCount = document.getElementById("cart_item_count_value");
            itemCount.textContent = Number(itemCount.textContent) + 1;

            // The Cart page forces a DS update, so do here too
            Page.runInPageContext(() => {
                window.SteamFacade.dynamicStoreInvalidateCache();
            });
        } else {
            // On store pages, reload so page elements are updated
            window.location.reload();
        }
    }

    // See https://github.com/SteamDatabase/SteamTracking/blob/14f2138651e27bae760d067c490948c1197e5e61/store.steampowered.com/public/javascript/main.js#L1419
    static async _addFreePromotion(endpoint, formEl, onWishlist, addToCartEl) {

        const _endpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
        const body = new FormData(formEl);
        const id = body.get("subid") || body.get("bundleid");

        // Yield back to Steam if required fields are missing
        if (!id || !body.has("sessionid")) {
            formEl.submit();
        }

        const data = {
            "ajax": true,
            "sessionid": body.get("sessionid")
        };

        const response = await RequestData.post(`${_endpoint}${id}`, data).catch(err => console.error(err));

        // This endpoint returns an empty array on success
        if (!Array.isArray(response)) {
            Page.runInPageContext((errTitle, errDesc, errStr) => {
                window.SteamFacade.showAlertDialog(errTitle, errStr ? `${errDesc}<br><br>${errStr}` : errDesc);
            },
            [
                Localization.str.error,
                Localization.str.addtocart_dialog.error_desc_freepromo,
                response ? `Error code: ${response.purchaseresultdetail}` : undefined
            ]);

            return;
        }

        if (onWishlist) {
            addToCartEl.setAttribute("href", "https://store.steampowered.com/account/licenses/");
            addToCartEl.querySelector("span").textContent = Localization.str.in_account;

            Page.runInPageContext(() => {
                window.SteamFacade.dynamicStoreInvalidateCache();
            });
        } else {
            window.location.reload();
        }
    }
}
