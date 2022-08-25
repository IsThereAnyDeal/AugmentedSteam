import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, Price, User} from "../../../modulesContent";
import {AddToCart} from "../Common/AddToCart";

export default class FDLCCheckboxes extends Feature {

    checkPrerequisites() {
        // check if the page has at least one purchasable DLC available
        return document.querySelector(".game_area_dlc_section .game_area_dlc_list input[name^=subid]") !== null;
    }

    apply() {

        const dlcSection = document.querySelector(".game_area_dlc_section");

        for (const dlcRow of dlcSection.querySelectorAll(".game_area_dlc_row")) {
            const subidNode = dlcRow.querySelector("input[name^=subid]");
            if (!subidNode) { continue; }

            const label = document.createElement("label");
            label.classList.add("es_dlc_label");

            // Add dsinfo to label for use with select/unselect all
            if (dlcRow.classList.contains("ds_wishlist")) {
                label.classList.add("es_dlc_wishlist");
            } else if (dlcRow.classList.contains("ds_owned")) {
                label.classList.add("es_dlc_owned");
            }

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.dataset.esDlcSubid = subidNode.value;

            // Must check ".discount_final_price" first to get the correct price
            const priceNode = dlcRow.querySelector(".discount_final_price")
                || dlcRow.querySelector(".game_area_dlc_price");

            const price = Price.parseFromString(priceNode.textContent);
            if (price !== null) {
                checkbox.dataset.esDlcPrice = price.value;
            }

            label.append(checkbox);
            dlcRow.insertAdjacentElement("beforebegin", label);
        }

        // Toggle dsinfo on label when adding/removing wishlist via ds_options dropdown
        new MutationObserver(mutations => {
            for (const {target} of mutations) {
                if (!target.classList.contains("game_area_dlc_row")) { continue; }
                target.previousElementSibling.classList.toggle("es_dlc_wishlist", target.classList.contains("ds_wishlist"));
            }
        }).observe(dlcSection.querySelector(".gameDlcBlocks"), {"subtree": true, "attributeFilter": ["class"]});

        const html = `<div class="game_purchase_action game_purchase_action_bg" id="es_selected_btn">
                <div class="game_purchase_price price"></div>
                <div class="btn_addtocart">
                    <a class="btn_green_steamui btn_medium">
                        <span>${Localization.str.add_selected_dlc_to_cart}</span>
                    </a>
                </div>
            </div>`;

        const expandedNode = dlcSection.querySelector("#game_area_dlc_expanded");
        if (expandedNode) {
            HTML.afterEnd(expandedNode, html);
            HTML.afterEnd(dlcSection, '<div style="clear: both;"></div>');
        } else {
            HTML.afterEnd(dlcSection.querySelector(".gameDlcBlocks"), html);
        }

        const cartForm = document.createElement("form");
        cartForm.name = "add_selected_dlc_to_cart";
        cartForm.action = "/cart/";
        cartForm.method = "POST";

        const cartBtn = dlcSection.querySelector("#es_selected_btn");
        cartBtn.insertAdjacentElement("beforebegin", cartForm);
        cartBtn.addEventListener("click", () => {
            if (SyncedStorage.get("addtocart_no_redirect")) {
                AddToCart.post(cartForm);
            } else {
                cartForm.submit();
            }
        });

        HTML.afterEnd(dlcSection.querySelector(".gradientbg"),
            `<div id="es_dlc_option_panel">
                <div class="es_dlc_option" id="unowned_dlc_check">${Localization.str.dlc_select.unowned_dlc}</div>
                <div class="es_dlc_option" id="wl_dlc_check">${Localization.str.dlc_select.wishlisted_dlc}</div>
                <div class="es_dlc_option" id="no_dlc_check">${Localization.str.dlc_select.none}</div>
            </div>`);

        dlcSection.querySelector("#unowned_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label:not(.es_dlc_owned) > input");
            for (const node of nodes) {
                node.checked = true;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        dlcSection.querySelector("#wl_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label.es_dlc_wishlist > input");
            for (const node of nodes) {
                node.checked = true;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        dlcSection.querySelector("#no_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label > input:checked");
            for (const node of nodes) {
                node.checked = false;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        function createHiddenInput(name, value) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;

            return input;
        }

        const inputAction = createHiddenInput("action", "add_to_cart");
        const inputSessionId = createHiddenInput("sessionid", User.sessionId);

        dlcSection.addEventListener("change", () => {

            cartForm.innerHTML = "";
            cartForm.append(inputAction, inputSessionId);

            let total = 0;
            for (const node of dlcSection.querySelectorAll(".es_dlc_label > input:checked")) {

                cartForm.append(createHiddenInput("subid[]", node.dataset.esDlcSubid));

                if (node.dataset.esDlcPrice) {
                    total += Number(node.dataset.esDlcPrice);
                }
            }

            if (total > 0) {
                cartBtn.querySelector(".game_purchase_price").textContent = new Price(total);
                cartBtn.style.display = "block";
            } else {
                cartBtn.style.display = "none";
            }
        });
    }
}
