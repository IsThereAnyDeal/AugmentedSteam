<script lang="ts" context="module">
    import MarketPrices from "@Content/Features/Community/Inventory/Components/MarketPrices";

    const marketPrices: Map<string, MarketPrices> = new Map();
</script>

<script lang="ts">
    import {
        __error,
        __instantSell,
        __instantSellDesc,
        __loading,
        __quickSell,
        __quickSellDesc,
        __quickSellVerify,
        __selling
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import type {MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
    import Settings from "@Options/Data/Settings";
    import LoadingElement from "@Content/Features/Common/LoadingElement.svelte";
    import RequestData from "@Content/Modules/RequestData";

    export let marketInfo: MarketInfo;

    const diff = Settings.quickinv_diff;

    let selling: boolean = false;
    let status: string|null = null;

    let qs_node: HTMLElement;
    let is_node: HTMLElement;

    async function clickHandler(e: MouseEvent, price: number): Promise<void> {
        e.preventDefault();

        selling = true;

        const publisherFee = marketInfo.publisherFee;
        const feeInfo = await SteamFacade.calculateFeeAmount(price, publisherFee);
        const sellPrice = feeInfo.amount - feeInfo.fees;

        let response: Response|null = null;
        try {
            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4268
            response = await RequestData.post("https://steamcommunity.com/market/sellitem/", {
                sessionid: marketInfo.sessionId,
                appid: String(marketInfo.globalId),
                contextid: String(marketInfo.contextId),
                assetid: marketInfo.assetId,
                amount: "1", // TODO support stacked items, e.g. sack of gems
                price: String(sellPrice)
            });
        } catch(e) {
            console.error(e);
        }

        const result = await response?.json();
        if (!result?.success) {
            selling = false;
            status = result?.message ?? L(__error);
            return;
        }

        // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4368
        if (result.requires_confirmation) {
            selling = false;
            status = L(__quickSellVerify);
            return;
        }

        selling = false;
        status = null;

        marketPrices.delete(`${marketInfo.appid}_${marketInfo.hashName}`);

        const {globalId, contextId, assetId} = marketInfo;
        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`)!;
        thisItem.classList.add("btn_disabled", "activeInfo");
        thisItem.querySelector("a")?.click(); // reload item?
    }

    function prices(marketInfo: MarketInfo): MarketPrices {
        const key = `${marketInfo.appid}_${marketInfo.hashName}`;

        let prices = marketPrices.get(key);
        if (!prices) {
            prices = new MarketPrices(marketInfo);
            marketPrices.set(key, prices);
        }
        return prices;
    }

    $: if (qs_node) {
        SteamFacade.vTooltip(`#as_qsell`);
    }
    $: if (is_node) {
        SteamFacade.vTooltip(`#as_isell`);
    }
</script>


<div class="container">
    {#await prices(marketInfo).promise}
        <LoadingElement>{L(__loading)}</LoadingElement>
    {:then price}
        {#if price}
            {#if selling}
                <LoadingElement>{L(__selling)}</LoadingElement>
            {:else if status}
                {status}
            {:else}
                <div class="es_qsell_ctn">
                    {#if price.high > 0 && price.high > price.low}
                        <button id="as_qsell" class="as-inv-btn"
                           data-tooltip-text={L(__quickSellDesc, {"modifier": diff})}
                           on:click={e => clickHandler(e, price.high)}
                           bind:this={qs_node}
                        >{L(__quickSell, {amount: price.highFormatted})}</button>
                    {/if}

                    {#if price.low > 0}
                        <button id="as_isell" class="as-inv-btn as-blue"
                           data-tooltip-text={L(__instantSellDesc)}
                           on:click={e => clickHandler(e, price.low)}
                           bind:this={is_node}
                        >{L(__instantSell, {amount: price.lowFormatted})}</button>
                    {/if}
                </div>
            {/if}
        {/if}
    {/await}
</div>

