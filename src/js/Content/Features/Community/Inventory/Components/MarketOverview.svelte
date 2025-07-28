<script lang="ts" context="module">
    interface TPriceOverview {
        success?: boolean,
        lowest_price?: string,
        volume?: string
    }

    const cache = new Map<string, TPriceOverview>();
</script>

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__startingAt, __viewInMarket, __volumeSoldLast_24} from "@Strings/_strings";
    import RequestData from "@Content/Modules/RequestData";
    import {onMount} from "svelte";

    export let currency: number;
    export let globalId: number;
    export let hashName: string;

    let lowestPrice: string|null = null;
    let soldVolume: string|null = null;

    let promise: Promise<void> = new Promise(() => {});

    async function fetchMarketPriceOverview(): Promise<void> {
        try {
            let data: TPriceOverview|null = cache.get(hashName) ?? null;

            if (!data) {
                data = await RequestData.getJson<TPriceOverview>("https://steamcommunity.com/market/priceoverview/?"+new URLSearchParams({
                    currency: String(currency),
                    appid: String(globalId),
                    market_hash_name: hashName
                }));
            }

            if (data && data.success) {
                lowestPrice = data.lowest_price ?? null;
                soldVolume = data.volume ?? null;

                cache.set(hashName, data);
            }
        } catch (err) {
            console.error("Couldn't load price overview from market", err);
            return;
        }
    }

    onMount(() => {
        promise = fetchMarketPriceOverview();
    })
</script>


<!-- "View in market" link -->
<div style="height:24px;">
    <a href="//steamcommunity.com/market/listings/{globalId}/{hashName}">{L(__viewInMarket)}</a>
</div>

{#await promise}
    <img class="es_loading" src="//community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="Loading">
{:then _}
    <div style="min-height:3em;margin-left:1em;">
        {#if lowestPrice}
            {L(__startingAt, {price: lowestPrice})}
        {/if}

        {#if soldVolume}
            <br>{L(__volumeSoldLast_24, {sold: soldVolume})}
        {/if}
    </div>

    <div class="market_item_action_buyback_at_price"></div> <!-- // Steam spacing -->
{/await}

