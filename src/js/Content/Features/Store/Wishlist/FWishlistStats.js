import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, Messenger, Price} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FWishlistStats extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showwishliststats");
    }

    async apply() {

        this._appInfo = await Page.runInPageContext(() => window.SteamFacade.global("g_rgAppInfo"), null, true);

        HTML.beforeBegin("#wishlist_ctn", '<div id="esi-wishlist-chart-content"></div>');

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

        for (const data of Object.values(appInfo)) {
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
        totalPrice = new Price(totalPrice / 100);

        HTML.inner("#esi-wishlist-chart-content",
            `<div class="esi-wishlist-stat"><span class="num">${totalPrice}</span>${Localization.str.wl.total_price}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalCount}</span>${Localization.str.wl.in_wishlist}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalOnSale}</span>${Localization.str.wl.on_sale}</div>
            <div class="esi-wishlist-stat"><span class="num">${totalNoPrice}</span>${Localization.str.wl.no_price}</div>`);
    }
}
