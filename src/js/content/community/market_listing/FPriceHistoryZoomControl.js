import {Feature} from "modules";

import {HTML, Localization} from "core";
import {ExtensionLayer} from "common";

export default class FPriceHistoryZoomControl extends Feature {

    apply() {
        HTML.afterEnd(document.querySelectorAll(".zoomopt")[1], `<a class="zoomopt as-zoomcontrol">${Localization.str.year}</a>`);

        document.querySelector(".as-zoomcontrol").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => {
                pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
            });
        });
    }
}
