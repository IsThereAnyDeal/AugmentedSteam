import {ExtensionResources, HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, Messenger, Price} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FWishlistStats extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showwishliststats");
    }

    async apply() {

        this._appInfo = await Page.runInPageContext(() => window.SteamFacade.global("g_rgAppInfo"), null, true);

        HTML.beforeBegin("#tab_filters",
            `<div class="filter_tab" id="esi-wishlist-stats">
                ${Localization.str.wl.label}
                <img src="//store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded_white.png">
            </div>`);

        HTML.beforeBegin("#section_filters",
            `<div class="filter_section" id="esi-wishlist-stats-content">
                <div class="esi-stat"><span id="esi-stat-price"></span>${Localization.str.wl.total_price}</div>
                <div class="esi-stat"><span id="esi-stat-count"></span>${Localization.str.wl.in_wishlist}</div>
                <div class="esi-stat"><span id="esi-stat-onsale"></span>${Localization.str.wl.on_sale}</div>
                <div class="esi-stat"><span id="esi-stat-noprice"></span>${Localization.str.wl.no_price}</div>
            </div>`);

        // Add a separate section for hidden entries
        this._addHiddenAppsCount();

        const statsBtn = document.getElementById("esi-wishlist-stats");
        const statsContent = document.getElementById("esi-wishlist-stats-content");

        statsBtn.addEventListener("click", e => {
            statsBtn.classList.toggle("hover");
            statsContent.classList.toggle("hover");
            e.preventDefault();
        });

        // capture this event so it doesn't get default prevented
        document.body.addEventListener("click", ({target}) => {
            if (statsBtn.contains(target) || statsContent.contains(target)) { return; }

            statsBtn.classList.remove("hover");
            statsContent.classList.remove("hover");
        }, true);

        Messenger.addMessageListener("wlUpdate", () => { this._updateStats(); });

        Page.runInPageContext(() => {
            const updateOld = window.CWishlistController.prototype.Update;

            window.CWishlistController.prototype.Update = function(...args) {
                updateOld.call(this, args);

                window.Messenger.postMessage("wlUpdate");
            };
        });

        this._updateStats();
    }

    async _updateStats() {

        let totalPrice = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

        const visibleApps = await Page.runInPageContext(() => window.SteamFacade.global("g_Wishlist").rgVisibleApps, null, true);
        const appInfo = visibleApps.map(appid => this._appInfo[appid]);

        for (const data of appInfo) {
            if (data.subs.length > 0) {
                totalPrice += data.subs[0].price;

                if (data.subs[0].discount_pct > 0) {
                    totalOnSale++;
                }
            } else {
                totalNoPrice++;
            }
        }

        document.getElementById("esi-stat-price").textContent = new Price(totalPrice / 100);
        document.getElementById("esi-stat-count").textContent = appInfo.length;
        document.getElementById("esi-stat-onsale").textContent = totalOnSale;
        document.getElementById("esi-stat-noprice").textContent = totalNoPrice;
    }

    _addHiddenAppsCount() {

        const hiddenApps = this.context.wishlistData
            .filter(({appid}) => !this._appInfo[appid])
            .sort((a, b) => {
                // Order items as they'd appear on the wishlist by default
                if (a.priority === b.priority) { return 0; }
                if (b.priority === 0) { return -1; }
                if (a.priority === 0) { return 1; }
                return a.priority - b.priority;
            })
            .map(({appid}) => appid);

        if (hiddenApps.length === 0) { return; }

        HTML.beforeEnd("#esi-wishlist-stats-content",
            `<div class="esi-stat" id="esi-stat-hidden-ctn" data-tooltip-text="${Localization.str.wl.hidden_tooltip}">
                <span id="esi-stat-hidden">${hiddenApps.length}</span>
                <div class="esi-stat-hidden-label">
                    ${Localization.str.wl.hidden}
                    <span>(?)</span>
                </div>
            </div>`);

        const icons = {
            "itad": ExtensionResources.getURL("img/itad.png"),
            "steamdb": ExtensionResources.getURL("img/ico/steamdb.png"),
        };

        document.getElementById("esi-stat-hidden-ctn").addEventListener("click", () => {
            Page.runInPageContext((hiddenApps, icons, removeStr, wlStr) => {
                const f = window.SteamFacade;
                const g = f.global;
                const canEdit = g("g_bCanEdit"); // `true` if logged in and viewing own wishlist

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

                f.showDialog(wlStr.hidden, html);

                if (!canEdit) { return; }

                document.querySelector(".newmodal_content").addEventListener("click", ({target}) => {
                    if (!target.closest(".as-wl-remove")) { return; }

                    const row = target.closest("[data-appid]");
                    const appidToRemove = Number(row.dataset.appid);

                    f.showConfirmDialog(wlStr.remove_title, `${wlStr.remove_confirm.replace("__appid__", appidToRemove)}<br><br>${wlStr.remove_confirm_warn}`)
                        .done(() => {
                            g("RemoveFromWishlist")(appidToRemove);
                            f.dynamicStoreInvalidateCache();

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
            },
            [
                hiddenApps,
                icons,
                Localization.str.remove,
                Localization.str.wl
            ]);
        });
    }
}
