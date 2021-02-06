import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FPriceHistoryZoomControl extends Feature {

    checkPrerequisites() {
        return document.getElementById("pricehistory") !== null;
    }

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
