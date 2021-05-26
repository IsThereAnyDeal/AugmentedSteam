import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature, Price, User} from "../../../modulesContent";

export default class FWishlistPurchaseCheckboxes extends CallbackFeature {

    setup() {

        this._selectedApps = new Map();

        // todo better layout
        HTML.beforeEnd(document.body,
            `<div id="es_cart_ctn">
                <img class="ico_cart" src="//steamstore-a.akamaihd.net/public/images/v6/ico/wishlist/ico_cart.png">
                <div class="cart_total"></div>
                <a class="btn_green_steamui btn_medium">
                    <span></span>
                </a>
            </div>`);

        const cartForm = document.createElement("form");
        cartForm.name = "add_selected_wishlist_to_cart";
        cartForm.action = "/cart/";
        cartForm.method = "POST";

        const cartBtn = document.querySelector("#es_cart_ctn");
        cartBtn.insertAdjacentElement("beforebegin", cartForm);
        cartBtn.addEventListener("click", () => { cartForm.submit(); });

        function createHiddenInput(name, value) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;

            return input;
        }

        const inputAction = createHiddenInput("action", "add_to_cart");
        const inputSessionId = createHiddenInput("sessionid", User.sessionId);

        document.querySelector("#wishlist_ctn").addEventListener("change", ({target}) => {
            if (!target.classList.contains("es_wishlist_selection")) { return; }

            cartForm.innerHTML = "";
            cartForm.append(inputAction, inputSessionId);

            let total = 0;
            for (const [subid, price] of this._selectedApps) {
                cartForm.append(createHiddenInput("subid[]", subid));
                total += price;
            }

            if (total > 0) {
                cartBtn.querySelector("a > span").textContent = `${Localization.str.add_to_cart} (${this._selectedApps.size})`;
                cartBtn.querySelector(".cart_total").textContent = `${Localization.str.purchase_total} ${new Price(total / 100)}`;
                cartBtn.style.visibility = "visible";
            } else {
                cartBtn.style.visibility = "hidden";
            }
        });
    }

    callback(nodes) {

        for (const node of nodes) {

            const container = node.querySelector(".purchase_container");
            if (!container || container.querySelector(".es_wishlist_selection")) { continue; }

            if (!container.querySelector("form")) { continue; } // no add to cart button

            const subid = container.querySelector("input[name=subid]").value;
            const price = Number(container.querySelector(".discount_block").dataset.priceFinal);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("es_wishlist_selection");

            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    this._selectedApps.set(subid, price);
                } else {
                    this._selectedApps.delete(subid);
                }
            });

            container.append(checkbox);
        }
    }
}
