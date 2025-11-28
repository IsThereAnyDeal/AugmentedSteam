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
    import type MarketPrices from "@Content/Features/Community/Inventory/Components/MarketPrices";
    import LoadingElement from "@Content/Features/Common/LoadingElement.svelte";
    import RequestData from "@Content/Modules/RequestData";

    export let info: MarketInfo;
    export let prices: MarketPrices;
    export let onsell: () => void;

    const diff = Settings.quickinv_diff;

    let selling: boolean = false;
    let status: string|null = null;

    let qs_node: HTMLElement;
    let is_node: HTMLElement;

    async function clickHandler(e: MouseEvent, price: number): Promise<void> {
        e.preventDefault();

        selling = true;

        const publisherFee = info.publisherFee;
        const feeInfo = await SteamFacade.calculateFeeAmount(price, publisherFee);
        const sellPrice = feeInfo.amount - feeInfo.fees;

        let response: Response|null = null;
        try {
            // https://github.com/SteamDatabase/SteamTracking/blob/13e4e0c8f8772ef316f73881af8c546218cf7117/steamcommunity.com/public/javascript/economy_v2.js#L4268
            response = await RequestData.post("https://steamcommunity.com/market/sellitem/", {
                sessionid: info.sessionId,
                appid: String(info.globalId),
                contextid: String(info.contextId),
                assetid: info.assetId,
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
        onsell();
    }

    $: if (qs_node) {
        SteamFacade.vTooltip(`#as_qsell`);
    }
    $: if (is_node) {
        SteamFacade.vTooltip(`#as_isell`);
    }
</script>


{#await prices.promise}
    <div class="container">
        <LoadingElement>{L(__loading)}</LoadingElement>
    </div>
{:then price}
    {#if price}
        <div class="container">
            {#if selling}
                <LoadingElement>{L(__selling)}</LoadingElement>
            {:else if status}
                {status}
            {:else}
                <div class="es_qsell_ctn">
                    {#if price.high > 0 && price.high > price.low}
                        <button id="as_qsell"
                           data-tooltip-text={L(__quickSellDesc, {"modifier": diff})}
                           on:click={e => clickHandler(e, price.high)}
                           bind:this={qs_node}
                        >{L(__quickSell, {amount: price.highFormatted})}</button>
                    {/if}

                    {#if price.low > 0}
                        <button id="as_isell"
                           data-tooltip-text={L(__instantSellDesc)}
                           on:click={e => clickHandler(e, price.low)}
                           bind:this={is_node}
                        >{L(__instantSell, {amount: price.lowFormatted})}</button>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
{/await}


<style>
    .container {
        width: 346px;
        box-sizing: border-box;
        background: radial-gradient(ellipse at center top, #333333, #1e1e1e);
        padding: 15px;
        text-align: center;
    }

    button {
        border: 0;
        outline: 0;
        height: 24px;
        padding: 0 12px;
        border-radius: 2px;
        background: #80a006;
        transition: background-color .15s cubic-bezier(.07,.95,0,1);
        font-family: var(--font-family, "Motiva Sans");
        font-size: 12px;
        color: white;
        cursor: pointer;

        &:hover {
            background: #a5cb00;
        }
    }
</style>