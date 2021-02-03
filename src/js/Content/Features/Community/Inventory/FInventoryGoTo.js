import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {DOMHelper, Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInventoryGoTo extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showinvnav");
    }

    apply() {
        this._insertScript();

        // Go to first page
        HTML.afterEnd("#pagebtn_previous", '<a id="pagebtn_first" class="pagebtn pagecontrol_element disabled">&lt;&lt;</a>');
        document.getElementById("pagebtn_first").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.firstPage(); });
        });

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", '<a id="pagebtn_last" class="pagebtn pagecontrol_element">&gt;&gt;</a>');
        document.getElementById("pagebtn_last").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.lastPage(); });
        });

        // Page number box
        const pageMax = document.getElementById("pagecontrol_max");
        HTML.beforeBegin("#inventory_pagecontrols",
            `<div id="es_pagego">
                <input type="number" id="es_pagenumber" class="filter_search_box" value="1" min="1" max="${pageMax.textContent}">
                <a id="es_gotopage_btn" class="pagebtn">${Localization.str.go}</a>
            </div>`);
        document.getElementById("es_gotopage_btn").addEventListener("click", () => {
            Page.runInPageContext(() => { window.SteamFacade.goToPage(); });
        });
        // Update the input's max value when the number of pages changes
        new MutationObserver(() => {
            document.getElementById("es_pagenumber").max = pageMax.textContent;
        }).observe(pageMax, {"subtree": true, "childList": true});

        new MutationObserver(mutations => {
            for (const {target} of mutations) {
                const id = target.id;

                // Hide page number box when page controls are hidden
                if (id === "inventory_pagecontrols") {
                    document.getElementById("es_pagego").style.visibility = target.style.visibility;
                }

                if (id === "pagebtn_next") {
                    document.getElementById("pagebtn_last").classList.toggle("disabled", target.classList.contains("disabled"));
                } else if (id === "pagebtn_previous") {
                    document.getElementById("pagebtn_first").classList.toggle("disabled", target.classList.contains("disabled"));
                }
            }
        }).observe(document.getElementById("inventory_pagecontrols"), {"subtree": true, "attributes": true});
    }

    _insertScript() {

        DOMHelper.insertScript({"content":
            `function ensureFn() {
                if (typeof g_ActiveInventory.GoToPage === "function") { return; }
                g_ActiveInventory.GoToPage = function(page) {
                    const nPageWidth = this.m_$Inventory.children(".inventory_page:first").width();
                    const iCurPage = this.m_iCurrentPage;
                    const iNextPage = Math.min(Math.max(0, --page), this.m_cPages - 1);
                    const iPages = this.m_cPages;
                    if (iCurPage < iNextPage) {
                        if (iCurPage < iPages - 1) {
                            this.PrepPageTransition(nPageWidth, iCurPage, iNextPage);
                            this.m_$Inventory.css("left", "0");
                            this.m_$Inventory.animate({"left": -nPageWidth}, 250, null, () => this.FinishPageTransition(iCurPage, iNextPage));
                        }
                    } else if (iCurPage > iNextPage) {
                        if (iCurPage > 0) {
                            this.PrepPageTransition(nPageWidth, iCurPage, iNextPage);
                            this.m_$Inventory.css("left", "-" + nPageWidth + "px");
                            this.m_$Inventory.animate({"left": 0}, 250, null, () => this.FinishPageTransition(iCurPage, iNextPage));
                        }
                    }
                };
            }

            function InventoryLastPage() {
                ensureFn();
                g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);
            }
            function InventoryFirstPage() {
                ensureFn();
                g_ActiveInventory.GoToPage(1);
            }
            function InventoryGoToPage() {
                ensureFn();
                const page = $("es_pagenumber").value;
                if (isNaN(page)) { return; }
                g_ActiveInventory.GoToPage(parseInt(page));
            }`});
    }
}
