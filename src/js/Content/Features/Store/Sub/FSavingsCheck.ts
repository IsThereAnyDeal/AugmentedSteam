import Feature from "@Content/Modules/Context/Feature";
import {L} from "@Core/Localization/Localization";
import {__bundleSavingText} from "@Strings/_strings";
import type CSub from "@Content/Features/Store/Sub/CSub";
import Price from "@Content/Modules/Currency/Price";
import DOMHelper from "@Content/Modules/DOMHelper";
import HTML from "@Core/Html/Html";

export default class FSavingsCheck extends Feature<CSub> {

    override apply(): void {

        let notOwnedTotalPrice: number|null = 0;

        for (const node of document.querySelectorAll<HTMLElement>(".tab_item:not(.ds_owned)")) {
            let priceNode = node.querySelector(".discount_final_price");

            // Only present when the product has a price associated with (so it's not free or N/A)
            if (priceNode) {
                const finalPrice = Price.parseFromString(priceNode.textContent!);
                if (finalPrice) {
                    notOwnedTotalPrice += finalPrice.value;
                    continue;
                }
            } else {
                priceNode = node.querySelector(".final_price");
                if (priceNode && priceNode.textContent!.trim() === "N/A") {
                    notOwnedTotalPrice = null;
                    break;
                }
                continue;
            }
            console.warn("Couldn't find any price information for appid", node.dataset.dsAppid);
        }

        if (notOwnedTotalPrice !== null) {
            const priceNode = DOMHelper.selectLastNode(document, ".package_totals_area .price");
            if (!priceNode) { return; }

            const packagePrice = Price.parseFromString(priceNode.textContent!);
            if (!packagePrice) { return; }

            notOwnedTotalPrice -= packagePrice.value;

            if (!document.querySelector("#package_savings_bar")) {
                HTML.beforeEnd(".package_totals_area",
                    `<div id="package_savings_bar">
                        <div class="savings"></div>
                        <div class="message">${L(__bundleSavingText)}</div>
                    </div>`);
            }

            const savingsNode = document.querySelector<HTMLElement>("#package_savings_bar > .savings");
            if (savingsNode) {
                savingsNode.textContent = (new Price(notOwnedTotalPrice)).toString();
                if (notOwnedTotalPrice < 0) {
                    savingsNode.style.color = "red";
                }
            }
        }
    }
}
