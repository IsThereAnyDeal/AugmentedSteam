import {HTML, Localization, SyncedStorage} from "../../../modulesCore";
import {Feature, Inventory} from "../../../modulesContent";

export default class FShowCoupon extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("show_coupon");
    }

    async apply() {
        const coupon = await Inventory.getCoupon(this.context.appid);
        if (!coupon) { return; }

        const couponDate = coupon.valid && coupon.valid.replace(/\[date](.+)\[\/date]/, (m0, m1) => { return new Date(m1 * 1000).toLocaleString(); });

        HTML.beforeBegin("#game_area_purchase",
            `<div class="early_access_header">
                <div class="heading">
                    <h1 class="inset">${Localization.str.coupon_available}</h1>
                    <h2 class="inset">${Localization.str.coupon_application_note}</h2>
                    <p>${Localization.str.coupon_learn_more}</p>
                </div>
                <div class="devnotes">
                    <div style="display:flex;padding-top:10px">
                        <img src="http://cdn.steamcommunity.com/economy/image/${coupon.image_url}" style="width:96px;height:64px;"/>
                        <div style="display:flex;flex-direction:column;margin-left:10px">
                            <h1>${coupon.title}</h1>
                            <div>${coupon.discount_note || ""}</div>
                            <div style="color:#a75124">${couponDate}</div>
                        </div>
                    </div>
                </div>
            </div>`);

        // TODO show price in purchase box
    }
}
