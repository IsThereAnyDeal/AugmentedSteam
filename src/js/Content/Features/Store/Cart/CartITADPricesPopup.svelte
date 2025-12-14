<script lang="ts">
    import PriceWithAlt from "@Content/Modules/Prices/PriceWithAlt.svelte";
    import type {TPriceOverview} from "@Background/Modules/AugmentedSteam/_types";
    import {
        __pricing_historicalLow,
        __pricing_lowestPrice,
        __pricing_store,
        __pricing_withVoucher,
        __pricing_bundleCount,
        __pricing_bundled
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import HTML from "@Core/Html/Html";
    import external from "@Content/externalLink";

    export let data: TPriceOverview;
    export let priceNode: Element;

    let currentDrms: string[] = [];

    if (data.current) {
        currentDrms = data.current.drm
            .filter(d => d.id !== 61) // 61 = Steam
            .map(d => d.name);
    }

    let container: HTMLElement;

    // Add hover cursor styling to the price node
    priceNode.classList.add("es_itad_onmouse");

    priceNode.addEventListener("mouseenter", () => {
        const rects = priceNode.getBoundingClientRect();
        container.style.display = "block";
        container.style.top = `${rects.bottom + window.scrollY + 5}px`;
        container.style.left = `${rects.left + window.scrollX}px`;

        // Ensure popup doesn't go off-screen to the right
        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            if (containerRect.right > window.innerWidth) {
                container.style.left = `${window.innerWidth - containerRect.width - 10}px`;
            }
        });
    });

    priceNode.addEventListener("mouseleave", () => {
        container.style.display = "none";
    });
</script>


<div class="es_cart_itad_popup" bind:this={container}>
    <div class="es_cart_itad_arrow"></div>

    {#if data.current}
        <div class="es_cart_itad_row">
            <a href={data.urls.info} use:external class="es_cart_itad_label">{L(__pricing_lowestPrice)}</a>
            <span class="es_cart_itad_price">
                <PriceWithAlt price={data.current.price} />
            </span>
        </div>
        <div class="es_cart_itad_row es_cart_itad_detail">
            <a href={data.current.url} use:external>
                {#if data.current.cut > 0}
                    <span class="es_cart_itad_cut">-{data.current.cut}%</span>
                {/if}

                {#if data.current.voucher}
                    <span class="es_cart_itad_voucher">{L(__pricing_withVoucher, {"voucher": data.current.voucher})}</span>
                {/if}

                {@html L(__pricing_store, {"store": HTML.escape(data.current.shop.name)})}
                {#if currentDrms.length > 0}
                    <span class="es_cart_itad_drm">({currentDrms.join(", ")})</span>
                {/if}
            </a>
        </div>
    {/if}

    {#if data.lowest}
        <div class="es_cart_itad_row">
            <a href={data.urls.history} use:external class="es_cart_itad_label">{L(__pricing_historicalLow)}</a>
            <span class="es_cart_itad_price">
                <PriceWithAlt price={data.lowest.price} />
            </span>
        </div>
        <div class="es_cart_itad_row es_cart_itad_detail">
            {#if data.lowest.cut > 0}
                <span class="es_cart_itad_cut">-{data.lowest.cut}%</span>
            {/if}
            {@html L(__pricing_store, {"store": HTML.escape(data.lowest.shop.name)})}
            <span class="es_cart_itad_date">{new Date(data.lowest.timestamp).toLocaleDateString()}</span>
        </div>
    {/if}

    {#if data.bundled}
        <div class="es_cart_itad_row">
            <a href={data.urls.info} use:external class="es_cart_itad_label">{L(__pricing_bundled)}</a>
            <span class="es_cart_itad_bundled">{L(__pricing_bundleCount, {"count": data.bundled})}</span>
        </div>
    {/if}
</div>


<style>
    /**
     * Styles for parent container
     */
    :global(.es_itad_onmouse) {
        cursor: help;
    }

    :global(.es_itad_pricing_hover) {
        position: relative;
    }

    /**
     * Popup styles
     */
    .es_cart_itad_popup {
        display: none;
        position: absolute;
        z-index: 1000;
        background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
        padding: 10px 12px;
        border-radius: 4px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        border: 1px solid #16202d;
        min-width: 250px;
        max-width: 350px;
        font-size: 12px;
        color: #acb2b8;
        pointer-events: none;
    }

    .es_cart_itad_popup::before {
        content: "";
        position: absolute;
        width: 24px;
        height: 24px;
        background-image: url("extension://img/itad.png");
        background-size: contain;
        background-repeat: no-repeat;
        top: 8px;
        right: 8px;
        opacity: 0.6;
    }

    .es_cart_itad_arrow {
        position: absolute;
        top: -8px;
        left: 20px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid #2a475e;
    }

    .es_cart_itad_row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 4px;
    }

    .es_cart_itad_row:last-child {
        margin-bottom: 0;
    }

    .es_cart_itad_label {
        color: #67c1f5;
        text-decoration: none;
        white-space: nowrap;
    }

    .es_cart_itad_label:hover {
        color: #fff;
        text-decoration: underline;
    }

    .es_cart_itad_price {
        color: #acdbf5;
        font-weight: bold;
        margin-left: auto;
    }

    .es_cart_itad_detail {
        font-size: 11px;
        color: #8f98a0;
        padding-left: 10px;
        margin-bottom: 8px;
    }

    .es_cart_itad_detail a {
        color: #8f98a0;
        text-decoration: none;
    }

    .es_cart_itad_detail a:hover {
        color: #fff;
    }

    .es_cart_itad_cut {
        color: #a4d007;
        font-weight: bold;
        margin-right: 4px;
    }

    .es_cart_itad_voucher {
        color: #e5c07b;
        margin-right: 4px;
    }

    .es_cart_itad_drm {
        text-transform: uppercase;
        color: #626366;
        font-size: 10px;
    }

    .es_cart_itad_date {
        color: #626366;
        margin-left: 4px;
    }

    .es_cart_itad_bundled {
        color: #acdbf5;
        margin-left: auto;
    }
</style>
