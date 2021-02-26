import {Localization} from "../../../modulesCore";
import {ContextType, Feature} from "../../modulesContent";
import {Page} from "../Page";

export default class FPriceHistoryZoomYear extends Feature {

    checkPrerequisites() {
        return document.getElementById("pricehistory") !== null;
    }

    apply() {

        const zoomYear = document.createElement("a");
        zoomYear.classList.add("zoomopt");
        zoomYear.textContent = Localization.str.year;

        document.querySelectorAll(".zoomopt")[2].insertAdjacentElement("beforebegin", zoomYear);

        zoomYear.addEventListener("click", () => {
            if (this.context.type === ContextType.MARKET_LISTING) {
                Page.runInPageContext(() => { window.SteamFacade.zoomYear(); });
            } else if (this.context.type === ContextType.INVENTORY) {
                Page.runInPageContext(() => { window.SteamFacade.zoomYearForSellDialog(); });
            }
        });
    }
}
