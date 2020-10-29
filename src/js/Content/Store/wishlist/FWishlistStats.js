import {HTML, Localization, SyncedStorage} from "../../../core_modules";
import {Feature, Price} from "../../../Modules/content";
import {Page} from "../../Page";

export default class FWishlistStats extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showwishliststats") && document.getElementById("nothing_to_see_here").style.display === "none";
    }

    async apply() {

        // eslint-disable-next-line camelcase, no-undef
        const appInfo = await Page.runInPageContext(() => g_rgAppInfo, null, true);

        let totalPrice = 0;
        let totalCount = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

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

        HTML.beforeBegin("#wishlist_ctn",
            `<div id="esi-wishlist-chart-content">
                <div class="esi-wishlist-stat"><span class="num">${totalPrice}</span>${Localization.str.wl.total_price}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalCount}</span>${Localization.str.wl.in_wishlist}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalOnSale}</span>${Localization.str.wl.on_sale}</div>
                <div class="esi-wishlist-stat"><span class="num">${totalNoPrice}</span>${Localization.str.wl.no_price}</div>
            </div>`);
    }
}
