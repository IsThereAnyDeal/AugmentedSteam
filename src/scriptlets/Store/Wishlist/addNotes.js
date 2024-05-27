(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {str} = params;

    const wl = window.g_Wishlist;

    for (const elements of Object.values(wl.rgElements)) {
        const el = elements[0];

        const noteEl = document.createElement("div");
        noteEl.classList.add("esi-note", "esi-note--wishlist", "ellipsis");
        noteEl.innerText = str;

        el.querySelector(".mid_container").after(noteEl);
    }

    // Adjust the row height to account for the newly added note content
    wl.nRowHeight = $J(".wishlist_row").outerHeight(true);

    // Update initial container height
    document.getElementById("wishlist_ctn").style.height = `${wl.nRowHeight * wl.rgVisibleApps.length}px`;

    // The scroll handler loads the visible rows and adjusts their positions
    wl.OnScroll();
})();
