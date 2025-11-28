import self_ from "./FQuickSellOptions.svelte";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import MarketPrices from "@Content/Features/Community/Inventory/Components/MarketPrices";
import type {SvelteComponent} from "svelte";

export default class FQuickSellOptions extends Feature<CInventory> {

    private readonly marketPrices: Map<string, MarketPrices> = new Map();

    private svelte: SvelteComponent|null = null;

    constructor(context: CInventory) {
        super(context);
    }

    override checkPrerequisites(): boolean {
        return this.context.myInventory && Settings.quickinv;
    }

    override apply(): void | Promise<void> {
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private async callback(marketInfo: MarketInfo): Promise<void> {
        const {
            marketAllowed,
            assetId,
            contextId,
            globalId,
            walletCurrency,
            marketable,
        } = marketInfo;

        if (this.svelte) {
            this.svelte.$destroy();
            this.svelte = null;
        }

        // Additional checks for market eligibility, see https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L3675
        if (!marketAllowed || (walletCurrency === 0) || !marketable) { return; }

        const key = `${marketInfo.appid}_${marketInfo.hashName}`;
        let prices: MarketPrices|undefined = this.marketPrices.get(key);
        if (!prices) {
            prices = new MarketPrices(marketInfo);
            this.marketPrices.set(key, prices);
        }

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`)!;

        const svelte = new self_({
            target: document.querySelector(".inventory_page_right")!,
            props: {
                info: marketInfo,
                prices,
                onsell: () => {
                    svelte.$destroy();
                    this.marketPrices.delete(key);
                    thisItem.classList.add("btn_disabled", "activeInfo");
                    thisItem.querySelector("a")?.click(); // reload item?
                }
            }
        });
        this.svelte = svelte;
    }
}
