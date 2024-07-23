<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import Price from "@Content/Modules/Currency/Price";
    import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
    import User from "@Content/Modules/User";
    import {L} from "@Core/Localization/Localization";
    import {__regionUnavailable} from "@Strings/_strings";
    import type {PackageDetailsPrice} from "./FRegionalPricing";

    export let countries: string[];
    export let prices: Record<string, PackageDetailsPrice>;
    export let errors: Set<string>;
    export let priceNode: Element|null = null;

    let priceLocal: Price|null = null;
    try {
        const apiPrice: PackageDetailsPrice = prices[User.storeCountry.toLowerCase()]!;
        priceLocal = (new Price(apiPrice.final / 100, apiPrice.currency))
            .inCurrency(CurrencyManager.customCurrency);
    } catch (err) {
        handleError(err);
    }

    function getPriceUser(priceRegion: Price, country: string): Price|null {
        try {
            return priceRegion.inCurrency(CurrencyManager.customCurrency);
        } catch (err) {
            handleError(err, country);
            return null;
        }
    }

    function handleError(e: any, country?: string): void {
        const message = country
            ? `Can't show converted price and relative price differences for country code ${country.toUpperCase()}`
            : "Can't show relative price differences to any other currencies";

        if (!errors.has(message)) {
            errors.add(message);

            console.group("Regional pricing");
            console.warn(message);
            console.error(e);
            console.groupEnd();
        }
    }

    let container: HTMLElement;

    if (Settings.showregionalprice === "mouse") {

        priceNode!.addEventListener("mouseenter", () => {
            const rects = priceNode!.getBoundingClientRect();
            container.style.display = "block";
            container.style.top = `${rects.top + window.scrollY - 5}px`;
            container.style.left = `${rects.left - container.getBoundingClientRect().width}px`;
        });

        priceNode!.addEventListener("mouseleave", () => {
            container.style.display = "none";
        });
    }
</script>


<div class="es_regional_container" bind:this={container}>
    {#if Settings.showregionalprice === "mouse"}
        <div class="es_regional_arrow"></div>
    {/if}
    {#each countries as country}
        {@const apiPrice = prices[country]}
        <div class="es-regprice es-flag es-flag--{country}">
            {#if apiPrice}
                {@const priceRegion = new Price(apiPrice.final / 100, apiPrice.currency)}
                {@const priceUser = getPriceUser(priceRegion, country)}
                {priceRegion.toString()}
                    {#if priceLocal && priceUser}
                        {@const percentage = Number((((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2))}
                        {@const indicator = percentage > 0 ? "higher" : percentage < 0 ? "lower" : "equal"}
                        <span class="es-regprice__converted">{priceUser.toString()}</span>
                        <span class="es-regprice__perc es-regprice__perc--{indicator}">{Math.abs(percentage)}%</span>
                    {/if}
            {:else}
                <span class="es-regprice__none">{L(__regionUnavailable)}</span>
            {/if}
        </div>
    {/each}
</div>


<style>
    .es_regional_container {
        background: linear-gradient(to bottom, #33425a 5%, #282f3d 100%);
        padding: 7px 8px;
        box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.8);
        border: 1px solid black;
        text-align: left;
    }
    .es_regional_arrow {
        border-top: 9px solid transparent;
        border-bottom: 9px solid transparent;
        border-left: 8px solid #313f56;
        position: absolute;
        top: 12px;
        right: -8px;
        width: 0;
        height: 0;
    }

    .es-regprice {
        display: flex;
        align-items: baseline;
        font-size: 14px;
        white-space: nowrap;
    }
    .es-regprice__converted {
        font-size: 12px;
        text-align: right;
        flex-grow: 1;
        min-width: 60px;
        margin-left: 5px
    }
    .es-regprice__perc {
        font-size: 12px;
        margin-left: 5px;
        width: 60px;
        text-align: right;
    }
    .es-regprice__perc::after {
        content: "";
        width: 0;
        height: 0;
        margin-left: 4px;
        margin-bottom: 2px;
        position: relative;
        display: inline-block;
        border-color: transparent;
        border-style: solid;
    }
    .es-regprice__perc--higher {
        color: #ff1717;
    }
    .es-regprice__perc--equal {
        color: #e5e500;
    }
    .es-regprice__perc--lower {
        color: #60ad0a;
    }
    .es-regprice__perc--higher::after {
        border-width: 0 5px 5px 5px;
        border-bottom-color: #ff1717;
    }
    .es-regprice__perc--equal::after {
        width: 6px;
        content: "=";
    }
    .es-regprice__perc--lower::after {
        border-width: 5px 5px 0 5px;
        border-top-color: #60ad0a;
    }
    .es-regprice__none {
        font-size: 12px;
    }
</style>
