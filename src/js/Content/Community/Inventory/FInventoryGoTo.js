import {HTML, Localization, SyncedStorage} from "../../../modulesCore";
import {CallbackFeature, DOMHelper} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FInventoryGoTo extends CallbackFeature {

    constructor(context) {
        super(context, true, () => {
            new MutationObserver(() => {
                this.callback();
            }).observe(document.querySelector("div.games_list_tabs"), {"subtree": true, "attributes": true});
        });
    }

    checkPrerequisites() {
        return SyncedStorage.get("showinvnav");
    }

    callback() {

        // todo can this be circumvented?
        DOMHelper.remove("#es_gotopage");
        DOMHelper.remove("#pagebtn_first");
        DOMHelper.remove("#pagebtn_last");
        DOMHelper.remove("#es_pagego");

        DOMHelper.insertScript({"content":
            `g_ActiveInventory.GoToPage = function(page) {
                var nPageWidth = this.m_$Inventory.children('.inventory_page:first').width();
                var iCurPage = this.m_iCurrentPage;
                var iNextPage = Math.min(Math.max(0, --page), this.m_cPages-1);
                var iPages = this.m_cPages
                var _this = this;
                if (iCurPage < iNextPage) {
                    if (iCurPage < iPages - 1) {
                        this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                        this.m_$Inventory.css( 'left', '0' );
                        this.m_$Inventory.animate( {left: -nPageWidth}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                } else if (iCurPage > iNextPage) {
                    if (iCurPage > 0) {
                        this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                        this.m_$Inventory.css( 'left', '-' + nPageWidth + 'px' );
                        this.m_$Inventory.animate( {left: 0}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                }
            };

            function InventoryLastPage(){
                g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);
            }
            function InventoryFirstPage(){
                g_ActiveInventory.GoToPage(1);
            }
            function InventoryGoToPage(){
                var page = $('es_pagenumber').value;
                if (isNaN(page)) return;
                g_ActiveInventory.GoToPage(parseInt(page));
            }`}, "es_gotopage");

        // Go to first page
        HTML.afterEnd("#pagebtn_previous", "<a id='pagebtn_first' class='pagebtn pagecontrol_element disabled'>&lt;&lt;</a>");
        document.querySelector("#pagebtn_first").addEventListener("click", () => {
            Page.runInPageContext(() => { InventoryFirstPage(); }); // eslint-disable-line no-undef, new-cap
        });

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", "<a id='pagebtn_last' class='pagebtn pagecontrol_element'>&gt;&gt;</a>");
        document.querySelector("#pagebtn_last").addEventListener("click", () => {
            Page.runInPageContext(() => { InventoryLastPage(); }); // eslint-disable-line no-undef, new-cap
        });

        const pageGo = document.createElement("div");
        pageGo.id = "es_pagego";
        pageGo.style.float = "left";

        // Page number box
        const pageNumber = document.createElement("input");
        pageNumber.type = "number";
        pageNumber.value = "1";
        pageNumber.classList.add("filter_search_box");
        pageNumber.autocomplete = "off";
        pageNumber.placeholder = "page #";
        pageNumber.id = "es_pagenumber";
        pageNumber.style.width = "50px";
        pageNumber.min = 1;
        pageNumber.max = document.querySelector("#pagecontrol_max").textContent;

        pageGo.append(pageNumber);

        const gotoButton = document.createElement("a");
        gotoButton.textContent = Localization.str.go;
        gotoButton.id = "gotopage_btn";
        gotoButton.classList.add("pagebtn");
        // eslint-disable-next-line no-script-url -- Using it the way Steam does too
        gotoButton.href = "javascript:InventoryGoToPage();";
        gotoButton.style.width = "32px";
        gotoButton.style.padding = "0";
        gotoButton.style.margin = "0 6px";
        gotoButton.style.textAlign = "center";

        pageGo.append(gotoButton);

        document.querySelector("#inventory_pagecontrols").insertAdjacentElement("beforebegin", pageGo);

        const observer = new MutationObserver(mutations => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName !== "class") { return; }
                if (!mutation.target.id) { return; }

                const id = mutation.target.id;
                if (id === "pagebtn_next") {
                    document.querySelector("#pagebtn_last").classList.toggle(
                        "disabled",
                        mutation.target.classList.contains("disabled")
                    );
                } else if (id === "pagebtn_previous") {
                    document.querySelector("#pagebtn_first").classList.toggle(
                        "disabled",
                        mutation.target.classList.contains("disabled")
                    );
                }

            });
        });
        observer.observe(document.querySelector("#pagebtn_next"), {"attributes": true});
        observer.observe(document.querySelector("#pagebtn_previous"), {"attributes": true});
    }
}
