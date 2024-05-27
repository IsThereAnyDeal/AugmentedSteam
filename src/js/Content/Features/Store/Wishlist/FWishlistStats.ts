import {L} from "@Core/Localization/Localization";
import {
    __remove,
    __wl_hidden,
    __wl_hiddenTooltip,
    __wl_inWishlist,
    __wl_label,
    __wl_noPrice,
    __wl_onSale,
    __wl_removeConfirm,
    __wl_removeConfirmWarn,
    __wl_removeTitle,
    __wl_totalPrice,
} from "@Strings/_strings";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import Price from "@Content/Modules/Currency/Price";
import ExtensionResources from "@Core/ExtensionResources";
import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

interface AppInfo {
    subs?: Array<{
        price: string,
        discount_pct: number|null
    }>
}

export default class FWishlistStats extends Feature<CWishlist> {

    private _appInfo: Record<number, AppInfo> = {};

    override checkPrerequisites(): boolean {
        return Settings.showwishliststats;
    }

    override async apply(): Promise<void> {
        this._appInfo = await SteamFacade.global("g_rgAppInfo");

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

        const statsBtn = document.getElementById("esi-wishlist-stats")!;
        const statsContent = document.getElementById("esi-wishlist-stats-content")!;

        statsBtn.addEventListener("click", e => {
            statsBtn.classList.toggle("hover");
            statsContent.classList.toggle("hover");
            e.preventDefault();
        });

        // capture this event so it doesn't get default prevented
        document.body.addEventListener("click", e => {
            const target = e.target as HTMLElement;
            if (statsBtn.contains(target) || statsContent.contains(target)) { return; }

            statsBtn.classList.remove("hover");
            statsContent.classList.remove("hover");
        }, true);

        document.addEventListener("wlUpdate", () => this._updateStats());

        DOMHelper.insertScript("scriptlets/Store/Wishlist/wishlistControllerOverride.js");

        this._updateStats();
    }

    async _updateStats() {

        let totalPrice = 0;
        let totalOnSale = 0;
        let totalNoPrice = 0;

        const visibleApps = (await SteamFacade.global<{rgVisibleApps: string[]}>("g_Wishlist"))?.rgVisibleApps ?? [];
        const appInfo = visibleApps.map(appid => this._appInfo[Number(appid)]!);

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

        document.getElementById("esi-stat-price")!.textContent = (new Price(totalPrice / 100)).toString();
        document.getElementById("esi-stat-count")!.textContent = String(appInfo.length);
        document.getElementById("esi-stat-onsale")!.textContent = String(totalOnSale);
        document.getElementById("esi-stat-noprice")!.textContent = String(totalNoPrice);
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
            itad: ExtensionResources.getURL("img/itad.png"),
            steamdb: ExtensionResources.getURL("img/ico/steamdb.png"),
        };

        document.getElementById("esi-stat-hidden-ctn")!.addEventListener("click", () => {
            DOMHelper.insertScript("scriptlets/Store/Wishlist/hiddenApps.js", {
                hiddenApps,
                icons,
                removeStr: L(__remove),
                hiddenStr: L(__wl_hidden),
                removeConfirmStr: L(__wl_removeConfirm),
                removeConfirmWarnStr: L(__wl_removeConfirmWarn),
                removeTitleStr: L(__wl_removeTitle)
            });
        });
    }
}
