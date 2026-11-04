<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__error, __loadCardPrice, __loading, __lowestPrice, __retry, __toomanyrequests} from "@Strings/_strings";
    import RequestData from "@Content/Modules/RequestData";
    import {onMount} from "svelte";
    import SessionCacheApiFacade from "@Content/Modules/Facades/SessionCacheApiFacade";
    import Errors from "@Core/Errors/Errors";
    import Price from "@Content/Modules/Currency/Price";
    import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
    import {parseOrderBookResponse} from "@Content/Features/Community/Inventory/Components/MarketPrices";

    interface TCacheData {
        price: string,
        url: string
    }
    const CachePrefix = "market:card";
    const CardSuffixes = [
        ["", " (Foil)"],
        [" (Trading Card)", " (Foil Trading Card)"]
    ] as const;

    // export let country: string;
    // export let currency: string;
    export let appid: number;
    export let cardName: string;
    export let marketCardName: () => Promise<string>;
    export let foil: boolean;
    export let onprice: (price: Price) => void;

    let cacheName = `${appid}-${cardName}` + (foil ? "-foil" : "");

    let uriPath: string = `${appid}-${encodeURIComponent(cardName)}`;
    let promise: Promise<Price|null>|null = null;

    async function loadFromCache(): Promise<Price|null> {
        const cached = await SessionCacheApiFacade.get<TCacheData|null>(CachePrefix, cacheName);
        if (cached) {
            uriPath = cached.url;

            if (cached.price) {
                const price = Price.parseFromString(cached.price);
                if (price) {
                    onprice(price);
                    return price;
                }
            }
        }
        return null;
    }

    async function fetchCardPrices(marketHashName: string): Promise<Price|null> {
        let response;
        try {
            response = await RequestData.getJson<Parameters<typeof parseOrderBookResponse>[0]>(
                `https://steamcommunity.com/market/orderbook?q=Load&qp=${encodeURIComponent(JSON.stringify([753, marketHashName]))}`
            );

        } catch(e) {
            console.error(e);
            throw e;
        }

        // Steam wraps the orderbook payload in an outer `data` property (#2392)
        const orderbook = parseOrderBookResponse(response);
        if (!orderbook || !orderbook.data.amtMinSellOrder) {
            return null;
        }

        const price = Number(orderbook.data.amtMinSellOrder*0.01);
        const currencyCode = CurrencyManager.currencyIdToCode(orderbook.data.eCurrency);
        return new Price(price, currencyCode);
    }

    async function loadMarketCardPrice(): Promise<Price|null> {
        const marketHashName = `${appid}-${await marketCardName()}`;
        uriPath = encodeURIComponent(marketHashName);

        let price: Price|null = null;
        let fetched = false;
        for (const [sb, sf] of CardSuffixes) {
            const suffix = foil ? sf : sb;
            price = await fetchCardPrices(marketHashName + suffix);
            if (price) {
                fetched = true;
                uriPath += suffix;
                break;
            }
        }

        // Apply default suffix
        if (!fetched) {
            uriPath += CardSuffixes[0][foil ? 1 : 0];
        }

        if (price) {
            await SessionCacheApiFacade.set(CachePrefix, cacheName, {
                url: uriPath,
                price: price.toString()
            });
        }

        return price;
    }

    function load(): void {
        promise = (async () => {
            const price = await loadMarketCardPrice();
            if (price) {
                onprice(price);
            }
            return price;
        })();
    }

    onMount(() => {
        loadFromCache().then(price => {
            if (price) {
                promise = Promise.resolve(price);
            }
        });
    })
</script>


<span>
    {#if !promise}
        <button type="button" on:click={load}>
            {L(__loadCardPrice)}
        </button>
    {:else}
        {#await promise}
            {L(__loading)}
        {:then price}
            <a class="es_card_search" href="https://steamcommunity.com/market/listings/753/{uriPath}">
                {L(__lowestPrice)}
            </a>
            {price?.toString() ?? "N/A"}
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
    {/if}
</span>


<style>
    span {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        font-size: 12px;
    }

    a {
        padding: 0 2px;
        margin-top: 2px;

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