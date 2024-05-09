import {L} from "@Core/Localization/Localization";
import {
    __couponApplicationNote,
    __couponAvailable,
    __couponLearnMore_fullText,
    __couponLearnMore_linkText,
} from "@Strings/_strings";
import {HTML, SyncedStorage} from "../../../../modulesCore";
import {CurrencyManager, Feature, Inventory, Price} from "../../../modulesContent";

export default class FShowCoupon extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_coupon");
    }

    async apply() {
        const coupon = await Inventory.getCoupon(this.context.appid);
        if (!coupon) { return; }

        const couponDate = coupon.valid && coupon.valid.replace(/\[date](.+)\[\/date]/, (m0, m1) => { return new Date(m1 * 1000).toLocaleString(); });

        HTML.beforeBegin("#game_area_purchase",
            `<div class="early_access_header es_coupon_info">
                <div class="heading">
                    <h1 class="inset">${L(__couponAvailable)}</h1>
                    <h2 class="inset">${L(__couponApplicationNote)}</h2>
                    <p>${L(__couponLearnMore_fullText, {
                        "linkdesc": `<a href="https://support.steampowered.com/kb_article.php?ref=4210-YIPC-0275">${L(__couponLearnMore_linkText)}</a>`
                    })}</p>
                </div>
                <div class="devnotes">
                    <div style="display:flex;padding-top:10px">
                        <img src="//community.cloudflare.steamstatic.com/economy/image/${coupon.image_url}" style="width:96px;height:64px;">
                        <div style="display:flex;flex-direction:column;margin-left:10px">
                            <h1 style="margin-top:2px">${coupon.title}</h1>
                            <div>${coupon.discount_note || ""}</div>
                            <div style="color:#a75124">${couponDate}</div>
                        </div>
                    </div>
                </div>
            </div>`);

        // Update the purchase box with the discounted price
        const purchaseDiv = document.querySelector(".game_area_purchase_game_wrapper .game_purchase_action");
        if (!purchaseDiv) { return; }

        if (purchaseDiv.querySelector(".game_purchase_discount") && coupon.discount_doesnt_stack) {
            return;
        }

        const priceNode = purchaseDiv.querySelector("[data-price-final]");
        if (!priceNode) { return; }

        const currency = CurrencyManager.fromCode(CurrencyManager.storeCurrency);
        const scaleFactor = 10 ** currency.format.decimalPlaces;

        const originalPrice = Number(priceNode.dataset.priceFinal) / 100;
        const discountPrice = Math.floor(originalPrice * (coupon.discount / 100) * scaleFactor) / scaleFactor;
        const newFinalPrice = originalPrice - discountPrice;

        HTML.replace(priceNode,
            `<div class="discount_block game_purchase_discount">
                <div class="discount_pct">-${coupon.discount}%</div>
                <div class="discount_prices">
                    <div class="discount_original_price">${new Price(originalPrice)}</div>
                    <div class="discount_final_price">${new Price(newFinalPrice)}</div>
                </div>
            </div>`);
    }
}
