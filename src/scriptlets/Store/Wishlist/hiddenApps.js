(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {
        hiddenApps,
        icons,
        removeStr,
        hiddenStr,
        removeConfirmStr,
        removeConfirmWarnStr,
        removeTitleStr
    } = params;

    const canEdit = window.g_bCanEdit; // `true` if logged in and viewing own wishlist

    // We support removing items so use a global property to keep track of them
    const html = (window.asHiddenApps ??= hiddenApps).map(appid => {
        return `<div class="as-wl-remove-row" data-appid="${appid}">
                <a href="//steamcommunity.com/app/${appid}/discussions/" target="_blank">
                    <img src="//cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header_292x136.jpg" loading="lazy">
                </a>
                <a href="https://isthereanydeal.com/steam/app/${appid}/" target="_blank"><img src="${icons.itad}" title="ITAD"></a>
                <a href="https://steamdb.info/app/${appid}/" target="_blank"><img src="${icons.steamdb}" title="SteamDB"></a>
                ${canEdit ? `<span class="as-wl-remove">${removeStr}</span>` : ""}
            </div>`;
        }).join("");

    ShowDialog(hiddenStr.toUpperCase(), html);

    if (!canEdit) { return; }

    document.querySelector(".newmodal_content").addEventListener("click", ({target}) => {
        if (!target.closest(".as-wl-remove")) { return; }

        const row = target.closest("[data-appid]");
        const appidToRemove = Number(row.dataset.appid);

        ShowConfirmDialog(removeTitleStr, `${removeConfirmStr.replace("__appid__", appidToRemove)}<br><br>${removeConfirmWarnStr}`)
            .done(() => {
                window.RemoveFromWishlist(appidToRemove);
                GDynamicStore.InvalidateCache();

                // eslint-disable-next-line max-nested-callbacks
                window.asHiddenApps = window.asHiddenApps.filter(appid => appid !== appidToRemove);

                row.remove();
                const node = document.getElementById("esi-stat-hidden");
                node.textContent = window.asHiddenApps.length;
                if (window.asHiddenApps.length === 0) {
                    node.parentNode.remove();
                }
            });
    });
})();
