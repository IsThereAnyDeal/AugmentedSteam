import Feature from "@Content/Modules/Context/Feature";
import AppId from "@Core/GameId/AppId";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import Price from "@Content/Modules/Currency/Price";
import HTML from "@Core/Html/Html";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
import type {TAppDetail} from "@Background/Modules/Store/_types";

export default class FAddPriceToGifts extends Feature<CInventory> {

    override apply(): void {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private async callback(info: MarketInfo): Promise<void> {
        const {view, contextId, globalId} = info;

        if (contextId !== 1 || globalId !== 753) { return; }

        const itemActions = document.getElementById(`iteminfo${view}_item_actions`);
        if (!itemActions) { return; }

        // TODO: Add support for package(sub)
        const viewStoreBtn = itemActions.querySelector("a");
        if (!viewStoreBtn || !viewStoreBtn.href.startsWith("https://store.steampowered.com/app/")) { return; }

        const giftAppid = AppId.fromUrl(viewStoreBtn.href);
        if (!giftAppid) { return; }


        const result: TAppDetail|null = await SteamStoreApiFacade.fetchAppDetails(giftAppid, "price_overview")
        if (!result) { return; }

        const overview = result.price_overview;
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
