import {HTML, Localization} from "../../../core_modules";
import {Feature} from "../../../Modules/Content";
import {Page} from "../../Page";

export default class FPriceHistoryZoomControl extends Feature {

    apply() {
        HTML.afterEnd(document.querySelectorAll(".zoomopt")[1], `<a class="zoomopt as-zoomcontrol">${Localization.str.year}</a>`);

        document.querySelector(".as-zoomcontrol").addEventListener("click", () => {
            Page.runInPageContext(() => {
                // eslint-disable-next-line no-undef
                pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
            });
        });
    }
}
