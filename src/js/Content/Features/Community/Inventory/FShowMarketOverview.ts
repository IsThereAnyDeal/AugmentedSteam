import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
import MarketOverview from "@Content/Features/Community/Inventory/Components/MarketOverview.svelte";

export default class FShowMarketOverview extends Feature<CInventory> {

    // https://steamcommunity.com/groups/tradingcards/discussions/1/864969482042344380/#c864969482044786566
    private readonly _foilChance = 0.01;

    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private async callback(marketInfo: MarketInfo): Promise<void> {
        const {
            view,
            assetId,
            contextId,
            globalId,
            walletCurrency,
            marketable,
            hashName,
            restriction,
            appid,
            itemType
        } = marketInfo;

        /*
         * If the item in user's inventory is not marketable due to market restrictions,
         * or if not in own inventory but the item is marketable, build the HTML for showing info
         */
        if (!(this.context.myInventory && restriction && !marketable) && !marketable) { return; }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const marketActions = document.getElementById(`iteminfo${view}_item_market_actions`);
        if (!thisItem || !marketActions) {
            return;
        }

        marketActions.style.display = "block";
        (new MarketOverview({
            target: marketActions,
            anchor: marketActions.firstElementChild ?? undefined,
            props: {
                currency: CurrencyManager.getCurrencyInfo(CurrencyManager.storeCurrency).id,
                globalId,
                hashName
            }
        }));
    }
}
