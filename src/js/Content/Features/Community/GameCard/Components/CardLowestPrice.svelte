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
    interface TCacheData extends TMarketPriceOverview {
        url: string
    }
    const CachePrefix = "market:card";

    interface Props {
        country: string;
        currency: string;
        appid: number;
        cardName: string;
        foil: boolean;
        onprice: (price: Price) => void;
    }

    let {
        country,
        currency,
        appid,
        cardName,
        foil,
        onprice
    }: Props = $props();

    let uriPath: string = $state(`${appid}-${encodeURIComponent(cardName)}`);
    let promise = $state(new Promise(() => {}));

    async function fetchCardPrices(marketHashName: string): Promise<TMarketPriceOverview> {
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
            return await RequestData.getJson<TMarketPriceOverview>(url);
        } catch(e) {
            console.error(e);
            throw e;
        }
    }

    async function loadMarketCardPrices(): Promise<string|null> {
        const marketHashName = `${appid}-${cardName}`;
        const cacheName = marketHashName + (foil ? "-foil" : "")
        const cached = await SessionCacheApiFacade.get<TCacheData>(CachePrefix, cacheName);
        if (cached && cached.success) {
            uriPath = cached.url;
            return cached.lowest_price ?? null;
        }

        let data = await fetchCardPrices(marketHashName);
        if (data.success && !data.lowest_price) {
            const suffix = (foil ? " (Foil Trading Card)" : " (Trading Card)");
            data = await fetchCardPrices(marketHashName + suffix);
            if (data.success && data.lowest_price) {
                uriPath += suffix;
            }
        }
        if (data.success) {
            await SessionCacheApiFacade.set(CachePrefix, cacheName, Object.assign(data, {url: uriPath}));
        }
        return data.lowest_price ?? null;
    }

    async function getMarketCardPrices(): Promise<string|null> {
        const priceStr = await loadMarketCardPrices();
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


<a class="es_card_search" href="https://steamcommunity.com/market/listings/753/{uriPath}">
    {L(__lowestPrice)}
</a>

<span>
    {#await promise}
        {L(__loading)}
    {:then price}
        {price ?? "N/A"}
    {:catch e}
        <button type="button" onclick={load}>
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