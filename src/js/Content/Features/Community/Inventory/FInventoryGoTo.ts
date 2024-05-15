import {__go} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FInventoryGoTo extends Feature<CInventory> {

    override checkPrerequisites(): boolean {
        return Settings.showinvnav;
    }

    override apply(): void {

        // Go to first page
        HTML.afterEnd("#pagebtn_previous", '<a id="pagebtn_first" class="pagebtn pagecontrol_element disabled">&lt;&lt;</a>');

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", '<a id="pagebtn_last" class="pagebtn pagecontrol_element">&gt;&gt;</a>');

        // Page number box
        const pageMax = document.getElementById("pagecontrol_max");
        if (!pageMax) {
            throw new Error();
        }

        HTML.beforeBegin("#inventory_pagecontrols",
            `<div id="es_pagego">
                <input type="number" id="es_pagenumber" class="filter_search_box" value="1" min="1" max="${pageMax.textContent}">
                <a id="es_gotopage_btn" class="pagebtn">${L(__go)}</a>
            </div>`);

        // Update the input's max value when the number of pages changes
        new MutationObserver(() => {
            document.querySelector<HTMLInputElement>("#es_pagenumber")!.max = pageMax.textContent!;
        }).observe(pageMax, {"subtree": true, "childList": true});

        new MutationObserver(mutations => {
            for (const {target} of mutations) {
                const element = target as HTMLElement;
                const id = element.id;

                // Hide page number box when page controls are hidden
                if (id === "inventory_pagecontrols") {
                    document.getElementById("es_pagego")!.style.visibility = element.style.visibility;
                }

                if (id === "pagebtn_next") {
                    document.getElementById("pagebtn_last")!.classList.toggle("disabled", element.classList.contains("disabled"));
                } else if (id === "pagebtn_previous") {
                    document.getElementById("pagebtn_first")!.classList.toggle("disabled", element.classList.contains("disabled"));
                }
            }
        }).observe(document.getElementById("inventory_pagecontrols")!, {"subtree": true, "attributes": true});

        DOMHelper.insertScript("scriptlets/Community/Inventory/goToControls.js");
    }
}
