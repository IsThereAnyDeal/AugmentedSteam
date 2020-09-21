import {Feature} from "modules";

import {HTML, Localization, LocalStorage} from "core";
import {ExtensionLayer} from "common";

export default class FPopularRefreshToggle extends Feature {

    apply() {

        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${Localization.str.market_popular_items_toggle}"></div>`);

        document.querySelector("#es_popular_refresh_toggle").addEventListener("click", () => {
            this._toggleRefresh(!LocalStorage.get("popular_refresh"));
        });

        this._toggleRefresh(LocalStorage.get("popular_refresh", false));

        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
    }

    _toggleRefresh(state) {
        document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
        LocalStorage.set("popular_refresh", state);
        ExtensionLayer.runInPageContext(state => { g_bMarketWindowHidden = state; }, [state]);
    }
}