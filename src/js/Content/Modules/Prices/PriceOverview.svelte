<script lang="ts">
    import PriceWithAlt from "./PriceWithAlt.svelte";
    import type {TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";
    import {
        __pricing_bundleCount,
        __pricing_bundled,
        __pricing_historicalLow,
        __pricing_lowestPrice,
        __pricing_store,
        __pricing_withVoucher
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import HTML from "@Core/Html/Html";
    import external from "@Content/externalLink";

    interface Props {
        data: TPriceOverview,
        marginTop?: string,
        marginBottom?: string
    }

    let {
        data,
        marginTop,
        marginBottom
    }: Props = $props();

    let currentDrms: string[] = $derived(
        (data.current?.drm
            .filter(d => d.id !== 61) // 61 = Steam
            .map(d => d.name)) ?? []
    );
</script>


<div class="itad-pricing" style:margin-top={marginTop} style:margin-bottom={marginBottom}>
    {#if data.current}
        <a href={data.urls.info} use:external>{L(__pricing_lowestPrice)}</a>

        <span class="price">
            <PriceWithAlt price={data.current.price} />
        </span>

        <a href={data.current.url} class="main" use:external>
            {#if data.current.cut > 0}
                <span class="cut">-{data.current.cut}%</span>
            {/if}

            {#if data.current.voucher}
                <span class="voucher">{L(__pricing_withVoucher, {"voucher": data.current.voucher})}</span>
            {/if}

            {@html L(__pricing_store, {"store": HTML.escape(data.current.shop.name)})}
            {#if currentDrms.length > 0}
                <span class="drm">({currentDrms.join(", ")})</span>
            {/if}
        </a>
    {/if}

    {#if data.lowest}
        <a href={data.urls.history} use:external>{L(__pricing_historicalLow)}</a>

        <span class="price">
            <PriceWithAlt price={data.lowest.price} />
        </span>

        <div class="main">
            {#if data.lowest.cut > 0}
                <span class="cut">-{data.lowest.cut}%</span>
            {/if}
            {@html L(__pricing_store, {"store": HTML.escape(data.lowest.shop.name)})}
            {new Date(data.lowest.timestamp).toLocaleDateString()}
        </div>
    {/if}

    {#if data.bundled}
        <a href={data.urls.info} use:external>{L(__pricing_bundled)}</a>
        <div class="bundled">{L(__pricing_bundleCount, {"count": data.bundled})}</div>
    {/if}
</div>


<style>
    a {
        color: white;
        text-decoration: none;

        &:hover {
            color: #66c0f4;
        }
    }

    /* Fix space between prices and the purchase container when an "ADVANCED ACCESS" banner is present */
    .itad-pricing + :global(.game_area_purchase_game_wrapper .advanced_access_header_wrapper) {
        margin-top: -7px;
    }
    .itad-pricing {
        padding: 5px 5px 5px 42px;
        height: auto !important;
        border-bottom: 0;
        font-size: 12px;
        color: #a8b2ba;
        background-image: url("extension://img/itad.png");
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
    .main {
        white-space: normal;
    }
    .cut {
        color: #a4d007;
    }
    .price {
        font-size: 1.1em;
        color: #acdbf5;
        text-align: right;
    }
    .voucher {
        font-size: 1.1em;
    }
    .drm {
        text-transform: uppercase;
        color: #626366;
    }
    .bundled {
        grid-column: 2 / span 2
    }
</style>
