<svelte:options accessors immutable />

<script lang="ts">
    import {Localization} from "../../../Core/Localization/Localization";
    import {HTML} from "../../../modulesCore";
    import PriceWithAlt from "./PriceWithAlt.svelte";
    import {afterUpdate} from "svelte";
    import type {TPriceOverview} from "../../../Background/Modules/AugmentedSteam/_types";

    export let data: TPriceOverview;
    export let setBottom: boolean = false;
    export let height: number|undefined;

    const pricingStr = Localization.str.pricing;

    let node: HTMLElement;
    let currentDrms: string[];

    if (data.current) {
        currentDrms = data.current.drm
            .filter(d => d.id !== 61) // 61 = Steam
            .map(d => d.name);
    }

    afterUpdate(() => {
        if (!setBottom || !height) {
            return;
        }
        height = Math.ceil(node.getBoundingClientRect().height);
        node.style.bottom = `${-height}px`;
    });
</script>


<div class="itad-pricing" bind:this={node}>
    {#if data.current}
        <a href={data.urls.info} target="_blank">{pricingStr.lowest_price}</a>

        <span class="itad-pricing__price">
            <PriceWithAlt price={data.current.price} />
        </span>

        <a href={data.current.url} class="itad-pricing__main" target="_blank">
            {#if data.current.cut > 0}
                <span class="itad-pricing__cut">-{data.current.cut}%</span>
            {/if}

            {#if data.current.voucher}
                <span class="itad-pricing__voucher">{pricingStr.with_voucher.replace("__voucher__", data.current.voucher)}</span>
            {/if}

            {@html pricingStr.store.replace("__store__", HTML.escape(data.current.shop.name))}
            {#if currentDrms.length > 0}
                <span class="itad-pricing__drm">({currentDrms.join(", ")})</span>
            {/if}
        </a>
    {/if}

    {#if data.lowest}
        <a href={data.urls.info} target="_blank">{pricingStr.historical_low}</a>

        <span class="itad-pricing__price">
            <PriceWithAlt price={data.lowest.price} />
        </span>

        <div class="itad-pricing__main">
            {#if data.lowest.cut > 0}
                <span class="itad-pricing__cut">-{data.lowest.cut}%</span>
            {/if}
            {@html pricingStr.store.replace("__store__", HTML.escape(data.lowest.shop.name))}
            {new Date(data.lowest.timestamp).toLocaleDateString()}
        </div>
    {/if}

    {#if data.bundled}
        <a href={data.urls.info} target="_blank">{pricingStr.bundled}</a>
        <div class="itad-pricing__bundled">{pricingStr.bundle_count.replace("__count__", data.bundled)}</div>
    {/if}
</div>


<style>
    .itad-pricing {
        padding: 5px 5px 5px 42px;
        height: auto !important;
        border-bottom: 0;
        font-size: 12px;
        color: #a8b2ba;
        background-color: rgba(0, 0, 0, 0.2);
        background-repeat: no-repeat;
        background-position: 9px center;
        background-size: 24px;
        display: grid;
        grid-template-columns: min-content min-content auto;
        grid-column-gap: 10px;
        white-space: nowrap;
        line-height: 1.5;
        align-items: baseline;
    }
    .itad-pricing__main {
        white-space: normal;
    }
    .itad-pricing__cut {
        color: #a4d007;
    }
    .itad-pricing__price {
        font-size: 1.1em;
        color: #acdbf5;
        text-align: right;
    }
    .itad-pricing__voucher {
        font-weight: bold;
        font-size: 1.1em;
    }
    .itad-pricing__drm {
        text-transform: uppercase;
        color: #626366;
    }
    .itad-pricing__bundled {
        grid-column: 2 / span 2
    }
</style>
