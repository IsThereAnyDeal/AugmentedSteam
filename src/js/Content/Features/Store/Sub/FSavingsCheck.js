import {HTML, Localization} from "../../../../modulesCore";
import {DOMHelper, Feature, Price} from "../../../modulesContent";

export default class FSavingsCheck extends Feature {

    apply() {

        let notOwnedTotalPrice = 0;

        for (const node of document.querySelectorAll(".tab_item:not(.ds_owned)")) {
            let priceNode = node.querySelector(".discount_final_price");

            // Only present when the product has a price associated with (so it's not free or N/A)
            if (priceNode) {
                const finalPrice = Price.parseFromString(priceNode.textContent);
                if (finalPrice) {
                    notOwnedTotalPrice += finalPrice.value;
                    continue;
                }
            } else {
                priceNode = node.querySelector(".final_price");
                if (priceNode && priceNode.textContent.trim() === "N/A") {
                    notOwnedTotalPrice = null;
                    break;
                }
                continue;
            }
            console.warn("Couldn't find any price information for appid", node.dataset.dsAppid);
        }

        if (notOwnedTotalPrice !== null) {
            const priceNode = DOMHelper.selectLastNode(document, ".package_totals_area .price");
            const packagePrice = Price.parseFromString(priceNode.textContent);
            if (!packagePrice) { return; }

            notOwnedTotalPrice -= packagePrice.value;

            if (!document.querySelector("#package_savings_bar")) {
                HTML.beforeEnd(".package_totals_area",
                    `<div id="package_savings_bar">
                        <div class="savings"></div>
                        <div class="message">${Localization.str.bundle_saving_text}</div>
                    </div>`);
            }

            const savingsNode = document.querySelector("#package_savings_bar > .savings");
            savingsNode.textContent = new Price(notOwnedTotalPrice);
            if (notOwnedTotalPrice < 0) {
                savingsNode.style.color = "red";
            }
        }
    }
}
