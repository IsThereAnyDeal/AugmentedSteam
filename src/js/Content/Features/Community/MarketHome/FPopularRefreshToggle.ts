import {__marketPopularItemsToggle} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

export default class FPopularRefreshToggle extends Feature<CMarketHome> {

    override async apply(): Promise<void> {

        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${L(__marketPopularItemsToggle)}"></div>`);

        document.querySelector("#es_popular_refresh_toggle")?.addEventListener("click", async () => {
            this._toggleRefresh(!(await LocalStorage.get("popular_refresh")));
        });

        this._toggleRefresh(await LocalStorage.get("popular_refresh") ?? false);

        SteamFacade.vTooltip("#es_popular_refresh_toggle");
    }

    _toggleRefresh(state: boolean): void {
        document.querySelector("#es_popular_refresh_toggle")?.classList.toggle("es_refresh_off", !state);
        LocalStorage.set("popular_refresh", state);
        SteamFacade.globalSet("g_bMarketWindowHidden", state);
    }
}
