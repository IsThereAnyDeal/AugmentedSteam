import Feature from "@Content/Modules/Context/Feature";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";

export default class FRestorePriceCut extends Feature<CStoreBase> {

    override checkPrerequisites(): boolean {
        return Settings.restore_price_cut;
    }

    override async apply(): Promise<void> {

        const discountNodes = document.querySelectorAll<HTMLDivElement>(".game_purchase_discount:has(.discount_icon)");
        console.log(discountNodes);
        for (const node of discountNodes) {
            const discount = parseInt(node.dataset.discount ?? "");
            if (!Number.isFinite(discount) || discount <= 0 || discount >= 100) {
                continue;
            }

            const iconNode = node.querySelector<HTMLDivElement>(".discount_icon")!;
            iconNode.innerText = `-${discount}%`
            iconNode.classList.add("discount_pct");
            iconNode.classList.remove("discount_icon");

            const parent = node.closest(".game_area_purchase_game");
            if (parent) {
                const normalPrice = parent.querySelector<HTMLTableCellElement>("td.normal_price")?.innerText;

                if (normalPrice) {
                    const finalPriceNode = node.querySelector(".discount_final_price");

                    if (finalPriceNode) {
                        const fullPriceNode = document.createElement("div");
                        fullPriceNode.classList.add("discount_original_price");
                        fullPriceNode.innerText = normalPrice;
                        finalPriceNode.insertAdjacentElement("beforebegin", fullPriceNode);

                        finalPriceNode.closest(".generic_discount")?.classList.remove("generic_discount");
                    }
                }
            }
        }
    }
}
