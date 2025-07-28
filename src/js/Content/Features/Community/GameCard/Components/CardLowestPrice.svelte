<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__error, __loading, __lowestPrice, __retry, __toomanyrequests} from "@Strings/_strings";
    import RequestData from "@Content/Modules/RequestData";
    import {onMount} from "svelte";
    import TimeUtils from "@Core/Utils/TimeUtils";
    import SessionCacheApiFacade from "@Content/Modules/Facades/SessionCacheApiFacade";
    import Errors from "@Core/Errors/Errors";
    import Price from "@Content/Modules/Currency/Price";
    import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";

    interface TMarketPriceOverview {
        success: boolean,
        lowest_price?: string
    }
    const CachePrefix = "market:card";

    export let country: string;
    export let currency: string;
    export let appid: number;
    export let cardName: string;
    export let onprice: (price: Price) => void;

    let promise = new Promise(() => {});

    async function fetchMarketCardPrices(): Promise<string|null> {
        const marketHashName = `${appid}-${cardName}`;
        const cached = await SessionCacheApiFacade.get<TMarketPriceOverview>(CachePrefix, marketHashName);
        if (cached && cached.success) {
            return cached.lowest_price ?? null;
        }

        // try to reduce chance for 429, not sure if this will help in any way shape or form
        const jitter = 100 + Math.floor(Math.random()*5000)
        await TimeUtils.timer(jitter);

        const url = "https://steamcommunity.com/market/priceoverview/?"+(new URLSearchParams({
            country,
            currency: String(CurrencyManager.getCurrencyInfo(currency).id),
            appid: "753",
            market_hash_name: marketHashName
        }));

        try {
            const data = await RequestData.getJson<TMarketPriceOverview>(url);

            if (data.success) {
                await SessionCacheApiFacade.set(CachePrefix, marketHashName, data);
                return data.lowest_price ? data.lowest_price : null;
            }
            return null;
        } catch(e) {
            console.error(e);
            throw e;
        }
    }

    async function getMarketCardPrices(): Promise<string|null> {
        const priceStr = await fetchMarketCardPrices();
        if (priceStr) {
            const price = Price.parseFromString(priceStr, currency);
            if (price) {
                onprice(price);
            }
        }
        return priceStr;
    }

    function load(): void {
        promise = getMarketCardPrices();
    }

    onMount(() => {
        load();
    });
</script>


<a class="es_card_search" href="https://steamcommunity.com/market/listings/{cardName}">
    {L(__lowestPrice)}
</a>

<span>
    {#await promise}
        {L(__loading)}
    {:then price}
        {price ?? "N/A"}
    {:catch e}
        <button type="button" on:click={load}>
            {#if e instanceof Errors.HTTPError && e.code === 429}
                {L(__toomanyrequests)}
            {:else}
                {L(__error)}
            {/if}
            ({L(__retry)})
        </button>
    {/await}
</span>


<style>
    a {
        padding: 0 2px;
        margin-top: 2px;
        display: block;
        width: 220px;

        &:hover {
            text-decoration: underline;
        }
    }

    button {
        display: inline;
        text-align: right;
        background: transparent;
        border: 0;
        outline: 0;
        color: white;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }
</style>