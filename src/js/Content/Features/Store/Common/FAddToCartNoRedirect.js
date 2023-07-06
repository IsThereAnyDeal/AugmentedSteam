import {SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";
import {AddToCart} from "./AddToCart";

export default class FAddToCartNoRedirect extends Feature {

    checkPrerequisites() {
        return !SyncedStorage.has("addtocart_no_redirect") || SyncedStorage.get("addtocart_no_redirect");
    }

    apply() {

        // This feature has different behavior on wishlists vs store pages
        const onWishlist = this.context.type === ContextType.WISHLIST;

        function getFormEl(href) {

            const matches = href.match(/^javascript:([^(]+)\((.+)?\)/);
            if (matches === null) { return null; }

            const arg = (matches[2] ?? "").trim();
            let formName;

            switch (matches[1]) {
                case "addToCart":
                    formName = `add_to_cart_${arg}`;
                    break;
                case "addBundleToCart":
                    formName = `add_bundle_to_cart_${arg}`;
                    break;
                case "GamePurchaseDropdownAddToCart":
                    formName = `add_to_cart_${arg.slice(1, -1)}`;
                    break;
                case "addAllDlcToCart":
                    formName = "add_all_dlc_to_cart";
                    break;
                default:
                    return null;
            }

            let formEl = document.forms[formName];

            // Special handling for bundles on wishlist
            if (onWishlist && !formEl && fnName === "addBundleToCart") {
                // Use the actual (wrong) name to locate the associated form
                formEl = document.forms[`add_to_cart_${arg}`];
                // Find the `input` element with the name `subid` and change it to `bundleid`
                const inputEl = formEl?.elements.subid;
                if (inputEl) {
                    inputEl.name = "bundleid";
                }
            }

            return formEl;
        }

        async function handler(e) {

            const node = e.target.closest("a[href^=javascript]");
            if (!node) { return; }

            const form = getFormEl(node.href);
            if (!form) { return; }

            if (!await AddToCart.checkFeatureHint()) { return; }

            e.preventDefault();

            AddToCart.post(form, onWishlist, node);
        }

        if (onWishlist) {
            document.addEventListener("click", handler);
        } else {
            // Avoid selecting the purchase option node, e.g. on GTA5, EVE Online
            for (const node of document.querySelectorAll(".btn_addtocart:not([id$='select_option']) > a[href^=javascript]")) {
                node.addEventListener("click", handler);
            }
        }
    }
}
