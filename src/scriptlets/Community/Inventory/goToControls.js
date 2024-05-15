(function() {
    function ensureFn() {
        // g_ActiveInventory is sometimes set to null or a different inventory, thus clearing our GoToPage fn

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

    document.getElementById("pagebtn_first").addEventListener("click", () => {
        ensureFn();
        g_ActiveInventory.GoToPage(1);
    });

    document.getElementById("pagebtn_last").addEventListener("click", () => {
        ensureFn();
        g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);
    });

    document.getElementById("es_gotopage_btn").addEventListener("click", () => {
        ensureFn();
        const page = $("es_pagenumber").value;
        if (isNaN(page)) { return; }
        g_ActiveInventory.GoToPage(parseInt(page));
    });
})();
