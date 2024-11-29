import {
    __addSelectedDlcToCart,
    __dlcSelect_none,
    __dlcSelect_unownedDlc,
    __dlcSelect_wishlistedDlc,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import HTML from "@Core/Html/Html";
import Price from "@Content/Modules/Currency/Price";
import DOMHelper from "@Content/Modules/DOMHelper";
import "./FDLCCheckboxes.css";

export default class FDLCCheckboxes extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        // check if the page has at least one purchasable DLC available
        return document.querySelector(".game_area_dlc_section .game_area_dlc_list input[name^=subid]") !== null;
    }

    override apply(): void {

        const dlcSection = document.querySelector(".game_area_dlc_section");
        if (!dlcSection) {
            return;
        }

        for (const dlcRow of dlcSection.querySelectorAll(".game_area_dlc_row")) {

            // Only add checkboxes to purchasable dlcs
            const subidNode = dlcRow.querySelector<HTMLInputElement>("input[name^=subid]");
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
                ?? dlcRow.querySelector(".game_area_dlc_price");

            const price = !priceNode ? null : Price.parseFromString(priceNode.textContent!);
            if (price !== null) {
                checkbox.dataset.esDlcPrice = String(price.value);
            }

            label.append(checkbox);

            const node = dlcRow.querySelector<HTMLElement>(":scope > div:first-child");
            if (!node) { continue; }

            // TODO remove when min version is increased to FF 121
            if (!CSS.supports("selector(:has(a))")) {
                if (dlcRow.classList.contains("dlc_highlight")) {
                    node.style.marginLeft = "-4px";
                } else {
                    node.style.display = "flex";
                    node.style.marginLeft = "-4px";
                    node.style.padding = "0";
                }
            }

            node.prepend(label);
        }

        // Toggle dsinfo on label when adding/removing wishlist via ds_options dropdown
        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const target = mutation.target as HTMLElement;
                if (!target.classList.contains("game_area_dlc_row")) { continue; }

                // Prevent errors when there're no labels, e.g. free dlcs
                const label = target.querySelector(".es_dlc_label");
                if (!label) { continue; }

                label.classList.toggle("es_dlc_wishlist", target.classList.contains("ds_wishlist"));
            }
        }).observe(
            dlcSection.querySelector(".gameDlcBlocks")!,
            {"subtree": true, "attributeFilter": ["class"]}
        );

        const html = `<div class="game_purchase_action game_purchase_action_bg" id="es_selected_btn">
                <div class="game_purchase_price price"></div>
                <div class="btn_addtocart">
                    <a class="btn_green_steamui btn_medium">
                        <span>${L(__addSelectedDlcToCart)}</span>
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

        const subids = new Set();
        const cartBtn = dlcSection.querySelector<HTMLElement>("#es_selected_btn")!;
        cartBtn.addEventListener("click", () => {
            DOMHelper.insertScript("scriptlets/Store/App/addItemToCart.js", {
                subids: Array.from(subids)
            });
        });

        HTML.afterEnd(dlcSection.querySelector(".gradientbg"),
            `<div id="es_dlc_option_panel">
                <div class="es_dlc_option" id="unowned_dlc_check">${L(__dlcSelect_unownedDlc)}</div>
                <div class="es_dlc_option" id="wl_dlc_check">${L(__dlcSelect_wishlistedDlc)}</div>
                <div class="es_dlc_option" id="no_dlc_check">${L(__dlcSelect_none)}</div>
            </div>`);

        dlcSection.querySelector("#unowned_dlc_check")!.addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll<HTMLInputElement>(".es_dlc_label:not(.es_dlc_owned) > input");
            for (const node of nodes) {
                node.checked = true;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        dlcSection.querySelector("#wl_dlc_check")!.addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll<HTMLInputElement>(".es_dlc_label.es_dlc_wishlist > input");
            for (const node of nodes) {
                node.checked = true;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        dlcSection.querySelector("#no_dlc_check")!.addEventListener("click", () => {
            const nodes = dlcSection.querySelectorAll<HTMLInputElement>(".es_dlc_label > input:checked");
            for (const node of nodes) {
                node.checked = false;
            }
            dlcSection.dispatchEvent(new Event("change"));
        });

        dlcSection.addEventListener("change", () => {

            subids.clear();

            let total = 0;
            for (const node of dlcSection.querySelectorAll<HTMLInputElement>(".es_dlc_label > input:checked")) {

                subids.add(Number(node.dataset.esDlcSubid));

                if (node.dataset.esDlcPrice) {
                    total += Number(node.dataset.esDlcPrice);
                }
            }

            if (total > 0) {
                cartBtn.querySelector<HTMLElement>(".game_purchase_price")!.textContent = (new Price(total)).toString();
                cartBtn.style.display = "block";
            } else {
                cartBtn.style.display = "none";
            }
        });
    }
}
