import {HTML, Localization} from "../../../../modulesCore";
import {Feature, Price, User} from "../../../modulesContent";

export default class FDLCCheckboxes extends Feature {

    checkPrerequisites() {
        // check if the page has at least one purchasable DLC available
        return document.querySelector(".game_area_dlc_section .game_area_dlc_list input[name^=subid]") !== null;
    }

    apply() {

        const dlcSection = document.querySelector(".game_area_dlc_section");
        const selectedDlcs = new Map();

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

            // Toggle dsinfo when adding/removing wishlist via ds_options dropdown
            new MutationObserver(() => {
                label.classList.toggle("es_dlc_wishlist", dlcRow.classList.contains("ds_wishlist"));
            }).observe(dlcRow, {"attributeFilter": ["class"]});

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("es_dlc_checkbox");

            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    const priceNode = dlcRow.querySelector(".discount_final_price")
                        || dlcRow.querySelector(".game_area_dlc_price");

                    const price = Price.parseFromString(priceNode.textContent);

                    if (price !== null) {
                        selectedDlcs.set(subidNode.value, price.value);
                    }
                } else {
                    selectedDlcs.delete(subidNode.value);
                }
            });

            label.append(checkbox);
            dlcRow.insertAdjacentElement("beforebegin", label);
        }

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
        cartBtn.addEventListener("click", () => { cartForm.submit(); });

        HTML.afterEnd(dlcSection.querySelector(".gradientbg"),
            `<div id="es_dlc_option_panel">
                <div class="es_dlc_option" id="unowned_dlc_check">${Localization.str.dlc_select.unowned_dlc}</div>
                <div class="es_dlc_option" id="wl_dlc_check">${Localization.str.dlc_select.wishlisted_dlc}</div>
                <div class="es_dlc_option" id="no_dlc_check">${Localization.str.dlc_select.none}</div>
            </div>`);

        const change = new Event("change", {"bubbles": true});

        dlcSection.querySelector("#unowned_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label:not(.es_dlc_owned) > input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcSection.querySelector("#wl_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label.es_dlc_wishlist > input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcSection.querySelector("#no_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".es_dlc_label > input:checked");
            for (const node of nodes) {
                node.checked = false;
                node.dispatchEvent(change);
            }
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

        dlcSection.addEventListener("change", ({target}) => {
            if (!target.classList.contains("es_dlc_checkbox")) { return; }

            cartForm.innerHTML = "";
            cartForm.append(inputAction, inputSessionId);

            let total = 0;
            for (const [subId, price] of selectedDlcs) {
                cartForm.append(createHiddenInput("subid[]", subId));
                total += price;
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
