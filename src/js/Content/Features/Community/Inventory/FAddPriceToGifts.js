import {GameId, HTML} from "../../../../modulesCore";
import {Background, CallbackFeature, Price} from "../../../modulesContent";

export default class FAddPriceToGifts extends CallbackFeature {

    async callback({view, contextId, globalId}) {

        if (contextId !== 1 || globalId !== 753) { return; }

        const itemActions = document.getElementById(`iteminfo${view}_item_actions`);

        // TODO: Add support for package(sub)
        const viewStoreBtn = itemActions.querySelector("a");
        if (!viewStoreBtn || !viewStoreBtn.href.startsWith("https://store.steampowered.com/app/")) { return; }

        const giftAppid = GameId.getAppid(viewStoreBtn.href);
        if (!giftAppid) { return; }

        const result = await Background.action("appdetails", giftAppid, "price_overview");
        if (!result || !result.success) { return; }

        const overview = result.data.price_overview;
        if (!overview) { return; }

        const discount = overview.discount_percent;
        const finalPrice = new Price(overview.final / 100, overview.currency);

        itemActions.style.display = "flex";
        itemActions.style.alignItems = "center";
        itemActions.style.justifyContent = "space-between";

        if (discount > 0) {
            const originalPrice = new Price(overview.initial / 100, overview.currency);
            HTML.beforeEnd(itemActions,
                `<div class="es_game_purchase_action">
                    <div class="es_game_purchase_action_bg">
                        <div class="es_game_purchase_discount">
                            <div class="es_discount_pct">-${discount}%</div>
                            <div class="es_discount_original_price">${originalPrice}</div>
                            <div class="es_discount_final_price">${finalPrice}</div>
                        </div>
                    </div>
                </div>`);
        } else {
            HTML.beforeEnd(itemActions,
                `<div class="es_game_purchase_action">
                    <div class="es_game_purchase_action_bg">
                        <div class="es_game_purchase_price">${finalPrice}</div>
                    </div>
                </div>`);
        }
    }
}
