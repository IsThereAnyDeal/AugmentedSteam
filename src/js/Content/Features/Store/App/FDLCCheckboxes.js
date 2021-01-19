import {ExtensionResources, HTML, Localization} from "../../../../modulesCore";
import {Feature, Price, User} from "../../../modulesContent";

export default class FDLCCheckboxes extends Feature {

    checkPrerequisites() {
        return document.querySelector(".game_area_dlc_section .game_area_dlc_list") !== null;
    }

    apply() {

        const dlcSection = document.querySelector(".game_area_dlc_section");
        const selectedDlcs = new Map();

        for (const dlcRow of dlcSection.querySelectorAll(".game_area_dlc_row")) {
            const subidNode = dlcRow.querySelector("input[name^=subid]");
            if (!subidNode) { continue; }

            const subid = subidNode.value;

            HTML.afterBegin(
                dlcRow.querySelector(".game_area_dlc_name"),
                `<input type="checkbox" class="es_dlc_selection" id="es_select_dlc_${subid}" value="${subid}">
                <label for="es_select_dlc_${subid}" style="background-image: url(${ExtensionResources.getURL("img/check_sheet.png")});"></label>`
            );

            dlcRow.querySelector("input").addEventListener("change", ({target}) => {
                if (target.checked) {
                    const priceNode = dlcRow.querySelector(".discount_final_price")
                        || dlcRow.querySelector(".game_area_dlc_price");

                    const price = Price.parseFromString(priceNode.textContent);

                    if (price !== null) {
                        selectedDlcs.set(subid, price.value);
                    }
                } else {
                    selectedDlcs.delete(subid);
                }
            });
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
            const nodes = dlcSection.querySelectorAll(".game_area_dlc_row:not(.ds_owned) input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcSection.querySelector("#wl_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".game_area_dlc_row.ds_wishlist input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcSection.querySelector("#no_dlc_check").addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll(".game_area_dlc_row input:checked");
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
            if (!target.classList.contains("es_dlc_selection")) { return; }

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
