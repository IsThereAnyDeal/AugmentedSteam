import {HTML, LocalStorage, Localization} from "../../../core_modules";
import {Feature} from "../../../Modules/content";
import {Page} from "../../Page";

export default class FPopularRefreshToggle extends Feature {

    apply() {

        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${Localization.str.market_popular_items_toggle}"></div>`);

        document.querySelector("#es_popular_refresh_toggle").addEventListener("click", () => {
            this._toggleRefresh(!LocalStorage.get("popular_refresh"));
        });

        this._toggleRefresh(LocalStorage.get("popular_refresh", false));

        // eslint-disable-next-line no-undef, new-cap
        Page.runInPageContext(() => { SetupTooltips({"tooltipCSSClass": "community_tooltip"}); });
    }

    _toggleRefresh(state) {
        document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
        LocalStorage.set("popular_refresh", state);
        // eslint-disable-next-line camelcase, no-undef
        Page.runInPageContext(state => { g_bMarketWindowHidden = state; }, [state]);
    }
}
