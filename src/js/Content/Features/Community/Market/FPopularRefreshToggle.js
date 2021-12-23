import {HTML, LocalStorage, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FPopularRefreshToggle extends Feature {

    apply() {

        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${Localization.str.market_popular_items_toggle}"></div>`);

        document.querySelector("#es_popular_refresh_toggle").addEventListener("click", () => {
            this._toggleRefresh(!LocalStorage.get("popular_refresh"));
        });

        this._toggleRefresh(LocalStorage.get("popular_refresh"));

        Page.runInPageContext(() => { window.SteamFacade.vTooltip("#es_popular_refresh_toggle"); });
    }

    _toggleRefresh(state) {
        document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
        LocalStorage.set("popular_refresh", state);
        Page.runInPageContext(state => {
            window.SteamFacade.globalSet("g_bMarketWindowHidden", state);
        }, [state]);
    }
}
