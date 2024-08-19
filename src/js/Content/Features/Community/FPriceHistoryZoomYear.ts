import {__year} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import ContextType from "@Content/Modules/Context/ContextType";
import DOMHelper from "@Content/Modules/DOMHelper";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";

export default class FPriceHistoryZoomYear extends Feature<CInventory|CMarketListing> {

    override checkPrerequisites(): boolean {
        return document.getElementById("pricehistory") !== null;
    }

    override apply(): void {

        const zoomYear = document.createElement("a");
        zoomYear.classList.add("zoomopt");
        zoomYear.textContent = L(__year);

        document.querySelectorAll(".zoomopt")[2]!.insertAdjacentElement("beforebegin", zoomYear);

        zoomYear.addEventListener("click", () => {
            if (this.context.type === ContextType.MARKET_LISTING) {
                DOMHelper.insertScript("scriptlets/Community/Inventory/zoomYear.js");
            } else if (this.context.type === ContextType.INVENTORY) {
                DOMHelper.insertScript("scriptlets/Community/Inventory/zoomYearForSellDialog.js");
            }
        });
    }
}
