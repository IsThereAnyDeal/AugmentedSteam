import {HTML, Localization} from "../../../core_modules";
import {ExtensionLayer, Feature} from "../../../Modules/content";

export default class FPriceHistoryZoomControl extends Feature {

    apply() {
        HTML.afterEnd(document.querySelectorAll(".zoomopt")[1], `<a class="zoomopt as-zoomcontrol">${Localization.str.year}</a>`);

        document.querySelector(".as-zoomcontrol").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => {
                // eslint-disable-next-line no-undef
                pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
            });
        });
    }
}
