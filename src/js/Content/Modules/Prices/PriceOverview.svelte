<svelte:options accessors immutable />

<script lang="ts">
    import {HTML, Localization, SyncedStorage} from "../../../modulesCore";
    import type {TPriceOverview} from "./_types";
    import PriceWithAlt from "./PriceWithAlt.svelte";
    import {afterUpdate} from "svelte";

    export let id: number;
    export let data: TPriceOverview;
    export let setBottom: boolean = false;
    export let height: number;

    const pricingStr = Localization.str.pricing;
    const showVoucher = SyncedStorage.get("showlowestpricecoupon");

    let node: HTMLElement;
    let currentDrms: string[];

    if (data.current) {
        currentDrms = data.current.drm
            .filter(d => d.id !== 61) // 61 = Steam
            .map(d => d.name);
    }

    afterUpdate(() => {
        if (!setBottom) { return; }
        height = Math.ceil(node.getBoundingClientRect().height);
        node.style.bottom = `${-height}px`;
    });
</script>


<div class="itad-pricing" id="es_price_{id}" bind:this={node}>
    {#if data.current}
        <a href={data.urls.info} target="_blank">{pricingStr.lowest_price}</a>

        <span class="itad-pricing__price">
            <PriceWithAlt price={data.current.price} />
        </span>

        <a href={data.current.url} class="itad-pricing__main" target="_blank">
            {#if data.current.cut > 0}
                <span class="itad-pricing__cut">-{data.current.cut}%</span>
            {/if}

            {#if showVoucher && data.current.voucher}
                <!-- TODO i got rid of "with voucher" string, because replacing html
                          into translation is no good: pricingStr.with_voucher
                          figure out a better way -->
                <span class="itad-pricing__voucher">{data.current.voucher}</span>
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
            {@html pricingStr.store.replace("__store__", HTML.escape(data.current.shop.name))}
            {new Date(data.lowest.timestamp).toLocaleDateString()}
        </div>
    {/if}

    <!-- TODO does this still have any value?
    {#if bundled}
        <a href="${bundledUrl}" target="_blank">{pricingStr.bundled}</a>
        <div class="itad-pricing__bundled">{pricingStr.bundle_count.replace("__count__", bundledCount)}</div>
    {/if}
    -->
</div>
