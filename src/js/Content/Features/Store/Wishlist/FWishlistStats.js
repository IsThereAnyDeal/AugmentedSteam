import {L} from "@Core/Localization/Localization";
import {
    __remove,
    __wl_hidden,
    __wl_hiddenTooltip,
    __wl_inWishlist,
    __wl_label,
    __wl_noPrice,
    __wl_onSale, __wl_removeConfirm, __wl_removeConfirmWarn, __wl_removeTitle,
    __wl_totalPrice,
} from "@Strings/_strings";
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
                ${L(__wl_label)}
                <img src="//store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded_white.png">
            </div>`);

        HTML.beforeBegin("#section_filters",
            `<div class="filter_section" id="esi-wishlist-stats-content">
                <div class="esi-stat"><span id="esi-stat-price"></span>${L(__wl_totalPrice)}</div>
                <div class="esi-stat"><span id="esi-stat-count"></span>${L(__wl_inWishlist)}</div>
                <div class="esi-stat"><span id="esi-stat-onsale"></span>${L(__wl_onSale)}</div>
                <div class="esi-stat"><span id="esi-stat-noprice"></span>${L(__wl_noPrice)}</div>
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
            const sub = data.subs?.[0];

            if (!sub || !sub.price) {
                totalNoPrice++;
                continue;
            }

            totalPrice += Number(sub.price);

            // `null` if sub is a package with no discount; 0 if sub is a bundle with no discount
            if (sub.discount_pct) {
                totalOnSale++;
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
            `<div class="esi-stat" id="esi-stat-hidden-ctn" data-tooltip-text="${L(__wl_hiddenTooltip)}">
                <span id="esi-stat-hidden">${hiddenApps.length}</span>
                <div class="esi-stat-hidden-label">
                    ${L(__wl_hidden)}
                    <span>(?)</span>
                </div>
            </div>`);

        const icons = {
            "itad": ExtensionResources.getURL("img/itad.png"),
            "steamdb": ExtensionResources.getURL("img/ico/steamdb.png"),
        };

        document.getElementById("esi-stat-hidden-ctn").addEventListener("click", () => {
            Page.runInPageContext((hiddenApps, icons, removeStr) => {
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

                f.showDialog(L(__wl_hidden).toUpperCase(), html);

                if (!canEdit) { return; }

                document.querySelector(".newmodal_content").addEventListener("click", ({target}) => {
                    if (!target.closest(".as-wl-remove")) { return; }

                    const row = target.closest("[data-appid]");
                    const appidToRemove = Number(row.dataset.appid);

                    f.showConfirmDialog(L(__wl_removeTitle), `${L(__wl_removeConfirm, {"appid": appidToRemove})}<br><br>${L(__wl_removeConfirmWarn)}`)
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
                L(__remove)
            ]);
        });
    }
}
