import {ExtensionResources, HTML, Localization} from "../../../core_modules";
import {Feature, User} from "../../../Modules/Content";

export default class FDLCCheckboxes extends Feature {

    checkPrerequisites() {
        return document.querySelector(".game_area_dlc_section .game_area_dlc_list");
    }

    apply() {

        const dlcs = document.querySelector(".game_area_dlc_section");
        const imgUrl = ExtensionResources.getURL("img/check_sheet.png");

        for (const dlc of dlcs.querySelectorAll(".game_area_dlc_row")) {
            if (dlc.querySelector("input")) {
                const value = dlc.querySelector("input").value;

                HTML.afterBegin(dlc.querySelector(".game_area_dlc_name"),
                    `<input type="checkbox" class="es_dlc_selection" id="es_select_dlc_${value}" value="${value}">
                    <label for="es_select_dlc_${value}" style="background-image: url(${imgUrl});"></label>`);
            } else {
                dlc.querySelector(".game_area_dlc_name").style.marginLeft = "23px";
            }
        }

        const expandedNode = dlcs.querySelector("#game_area_dlc_expanded");
        if (expandedNode) {
            HTML.afterEnd(expandedNode,
                `<div class="game_purchase_action game_purchase_action_bg" style="margin-bottom: 10px;" id="es_selected_btn">
                    <div class="btn_addtocart">
                        <a class="btnv6_green_white_innerfade btn_medium">
                            <span>${Localization.str.add_selected_dlc_to_cart}</span>
                        </a>
                    </div>
                </div>`);

            HTML.afterEnd(dlcs, '<div style="clear: both;"></div>');
        } else {
            HTML.afterEnd(dlcs.querySelector(".gameDlcBlocks"),
                `<div class="game_purchase_action game_purchase_action_bg" id="es_selected_btn">
                    <div class="btn_addtocart">
                        <a class="btnv6_green_white_innerfade btn_medium">
                            <span>${Localization.str.add_selected_dlc_to_cart}</span>
                        </a>
                    </div>
                </div>`);
        }

        const form = document.createElement("form");
        form.setAttribute("name", "add_selected_dlc_to_cart");
        form.setAttribute("action", "/cart/");
        form.setAttribute("method", "POST");
        form.setAttribute("id", "es_selected_cart");

        const cartBtn = dlcs.querySelector("#es_selected_btn");
        cartBtn.insertAdjacentElement("beforebegin", form);
        cartBtn.addEventListener("click", () => {
            form.submit();
        });

        HTML.afterEnd(dlcs.querySelector(".gradientbg"),
            `<div id="es_dlc_option_panel">
                <div class="es_dlc_option" id="unowned_dlc_check">${Localization.str.dlc_select.unowned_dlc}</div>
                <div class="es_dlc_option" id="wl_dlc_check">${Localization.str.dlc_select.wishlisted_dlc}</div>
                <div class="es_dlc_option" id="no_dlc_check">${Localization.str.dlc_select.none}</div>
            </div>`);

        const change = new Event("change", {"bubbles": true});

        dlcs.querySelector("#unowned_dlc_check").addEventListener("click", () => {
            const nodes = dlcs.querySelectorAll(".game_area_dlc_row:not(.ds_owned) input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcs.querySelector("#wl_dlc_check").addEventListener("click", () => {
            const nodes = dlcs.querySelectorAll(".ds_wishlist input:not(:checked)");
            for (const node of nodes) {
                node.checked = true;
                node.dispatchEvent(change);
            }
        });

        dlcs.querySelector("#no_dlc_check").addEventListener("click", () => {
            const nodes = dlcs.querySelectorAll(".game_area_dlc_row input:checked");
            for (const node of nodes) {
                node.checked = false;
                node.dispatchEvent(change);
            }
        });

        HTML.beforeEnd(dlcs.querySelector(".gradientbg"),
            `<a id="es_dlc_option_button">${Localization.str.dlc_select.select} ▼</a>`);

        dlcs.querySelector("#es_dlc_option_button").addEventListener("click", e => {
            dlcs.querySelector("#es_dlc_option_panel").classList.toggle("esi-shown");

            e.target.textContent = e.target.textContent.includes("▼")
                ? `${Localization.str.dlc_select.select} ▲`
                : `${Localization.str.dlc_select.select} ▼`;
        });

        dlcs.addEventListener("change", e => {
            if (!e.target.classList.contains("es_dlc_selection")) { return; }

            const cartForm = dlcs.querySelector("#es_selected_cart");
            cartForm.innerHTML = "";

            const inputAction = document.createElement("input");
            inputAction.type = "hidden";
            inputAction.name = "action";
            inputAction.value = "add_to_cart";

            const inputSessionId = document.createElement("input");
            inputSessionId.type = "hidden";
            inputSessionId.name = "sessionid";
            inputSessionId.value = User.sessionId;

            cartForm.append(inputAction, inputSessionId);

            const nodes = dlcs.querySelectorAll(".es_dlc_selection:checked");
            for (const node of nodes) {

                const inputSubId = document.createElement("input");
                inputSubId.type = "hidden";
                inputSubId.name = "subid[]";
                inputSubId.value = node.value;

                cartForm.append(inputSubId);
            }

            cartBtn.style.display = nodes.length > 0 ? "block" : "none";
        });
    }
}
