import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
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
                <img src="https://store.akamai.steamstatic.com/public/images/v6/btn_arrow_down_padded_white.png">
            </div>`);

        HTML.beforeBegin("#section_filters",
            `<div class="filter_section" id="esi-wishlist-stats-content">
                <div class="esi-stat"><span id="esi-stat-price"></span>${Localization.str.wl.total_price}</div>
                <div class="esi-stat"><span id="esi-stat-count"></span>${Localization.str.wl.in_wishlist}</div>
                <div class="esi-stat"><span id="esi-stat-onsale"></span>${Localization.str.wl.on_sale}</div>
                <div class="esi-stat"><span id="esi-stat-noprice"></span>${Localization.str.wl.no_price}</div>
            </div>`);

        const statsBtn = document.getElementById("esi-wishlist-stats");
        const statsContent = document.getElementById("esi-wishlist-stats-content");

        statsBtn.addEventListener("click", e => {
            statsBtn.classList.toggle("hover");
            statsContent.classList.toggle("hover");
            e.preventDefault();
        });

        // capture this event so it doesn't get default prevented
        document.body.addEventListener("click", ({target}) => {
            if (
                !statsBtn.classList.contains("hover")
                || target.closest("#esi-wishlist-stats, #esi-wishlist-stats-content") !== null
            ) {
                return;
            }

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
        let totalCount = 0;
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
            totalCount++;
        }

        document.getElementById("esi-stat-price").textContent = new Price(totalPrice / 100);
        document.getElementById("esi-stat-count").textContent = totalCount;
        document.getElementById("esi-stat-onsale").textContent = totalOnSale;
        document.getElementById("esi-stat-noprice").textContent = totalNoPrice;
    }
}
