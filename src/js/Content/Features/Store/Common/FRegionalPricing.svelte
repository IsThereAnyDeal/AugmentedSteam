<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import Price from "@Content/Modules/Currency/Price";
    import CurrencyManager from "@Content/Modules/Currency/CurrencyManager";
    import {L} from "@Core/Localization/Localization";
    import {__regionUnavailable} from "@Strings/_strings";
    import type {PackageDetailsPrice} from "./FRegionalPricing";
    import FlagIcon from "@Icons/FlagIcon.svelte";
    import type UserInterface from "@Core/User/UserInterface";

    export let user: UserInterface;
    export let countries: string[];
    export let prices: Record<string, PackageDetailsPrice>;
    export let errors: Set<string>;
    export let priceNode: Element|null = null;

    let priceLocal: Price|null = null;
    try {
        const apiPrice: PackageDetailsPrice = prices[user.storeCountry.toLowerCase()]!;
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
        priceNode!.classList.add("es_regional_onmouse");

        if (!Settings.regional_hideworld) {
            priceNode!.classList.add("es_regional_icon");
        }

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


<div class="es_regional"
     class:es_regional--always={Settings.showregionalprice === "always"}
     class:es_regional--onmouse={Settings.showregionalprice === "mouse"}
     bind:this={container}
>
    {#if Settings.showregionalprice === "mouse"}
        <div class="es_regional_arrow"></div>
    {/if}
    {#each countries as country}
        {@const apiPrice = prices[country]}
        <div class="es-regprice">
            <FlagIcon {country} />
            {#if apiPrice}
                {@const priceRegion = new Price(apiPrice.final / 100, apiPrice.currency)}
                {@const priceUser = getPriceUser(priceRegion, country)}
                {priceRegion.toString()}
                {#if priceLocal && priceUser}
                    {@const percentage = Number((((priceUser.value / priceLocal.value) * 100) - 100).toFixed(2))}
                    <span class="es-converted">{priceUser.toString()}</span>
                    <span class="es-perc"
                          class:es-perc--higher={percentage > 0}
                          class:es-perc--lower={percentage < 0}
                          class:es-perc--equal={percentage === 0}
                    >{Math.abs(percentage)}%</span>
                {/if}
            {:else}
                <span class="es-none">{L(__regionUnavailable)}</span>
            {/if}
        </div>
    {/each}
</div>


<style>
    /**
     * Styles for parent container
     */
    :global(.es_regional_prices .game_purchase_action),
    :global(.es_regional_prices .discount_block.game_purchase_discount) {
        overflow: visible !important;
    }
    :global(.es_regional_onmouse) {
        cursor: help;
    }

    :global(.es_regional_always::after) {
        content: "";
        display: block;
        clear: both;
    }

    :global(.es_regional_icon) {
        padding-left: 23px !important;
        background-image: url("extension://img/flags/world.png") !important;
        background-repeat: no-repeat !important;
        background-position: 8px 8px !important;
    }
    :global(.es_regional_icon.price) {
        padding-left: 30px !important;
    }


    /**
     * Local styles
     */
    .es_regional {
        background: linear-gradient(120deg, #2c3c4a 5%, #42515f 100%);
        padding: 7px 8px;
        text-align: left;
        border-radius: 4px;
    }
    .es_regional--always {
        display: block;
        position: relative;
        float: right;
        margin-top: auto;
        margin-top: 5px;
    }
    .es_regional--onmouse {
        /**
         * Raise the popup's z-index so it shows on top of subsequent purchase containers.
         * Set to higher than 500 (see #1969)
         */
        z-index: 1000;
        display: none;
        position: absolute;
        pointer-events: none;
        height: min-content;
        box-shadow: 2px 2px 15px rgba(0,0,0,0.4);
        border: 1px solid #16202d;
    }

    .es_regional_arrow {
        border-top: 9px solid transparent;
        border-bottom: 9px solid transparent;
        border-left: 8px solid #3c4b59;
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
        gap: 5px;
    }
    .es-converted {
        font-size: 12px;
        text-align: right;
        flex-grow: 1;
        min-width: 60px;
    }
    .es-perc {
        font-size: 12px;
        width: 60px;
        text-align: right;
    }
    .es-perc::after {
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
    .es-perc--higher {
        color: #ff1717;
    }
    .es-perc--higher::after {
        border-width: 0 5px 5px 5px;
        border-bottom-color: #ff1717;
    }

    .es-perc--equal {
        color: #e5e500;
    }
    .es-perc--equal::after {
        width: 6px;
        content: "=";
    }

    .es-perc--lower {
        color: #60ad0a;
    }
    .es-perc--lower::after {
        border-width: 5px 5px 0 5px;
        border-top-color: #60ad0a;
    }

    .es-none {
        font-size: 12px;
    }
</style>
