import {SyncedStorage} from "../../../../modulesCore";
import {ContextType, Feature} from "../../../modulesContent";
import {AddToCart} from "./AddToCart";

export default class FAddToCartNoRedirect extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("addtocart_no_redirect");
    }

    apply() {

        function getFormEl(href) {

            let formName;

            const fnName = href.match(/javascript:([^(]+)/)[1];
            switch (fnName) {
                case "addToCart":
                    formName = `add_to_cart_${href.match(/\d+/)[0]}`;
                    break;
                case "addBundleToCart":
                    formName = `add_bundle_to_cart_${href.match(/\d+/)[0]}`;
                    break;
                case "GamePurchaseDropdownAddToCart":
                    formName = `add_to_cart_${href.split("'")[1]}`;
                    break;
                case "addAllDlcToCart":
                    formName = "add_all_dlc_to_cart";
                    break;
                default:
                    return null;
            }

            return document.forms[formName];
        }

        function handler(e) {

            const node = e.target.closest("a[href^=javascript]");
            if (!node) { return; }

            const form = getFormEl(node.href);
            if (!form) { return; }

            e.preventDefault();

            AddToCart.post(form);
        }

        if (this.context.type === ContextType.WISHLIST) {
            document.addEventListener("click", handler);
        } else {
            for (const node of document.querySelectorAll(".btn_addtocart > a[href^=javascript]")) {
                node.addEventListener("click", handler);
            }
        }
    }
}
