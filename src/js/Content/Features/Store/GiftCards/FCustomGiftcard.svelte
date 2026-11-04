<script lang="ts">
    import {__wallet_customGiftcard} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import type {TCurrency} from "@Core/Currencies";
    import Price from "@Content/Modules/Currency/Price";

    interface Props {
        giftcardimage: string,
        currency: TCurrency,
        minValue: number,
        onsubmit: (price: Price) => void
    }

    let { giftcardimage, currency, minValue, onsubmit }: Props = $props();

    const step = $derived(10 ** -currency.format.places);

    let priceValue = $derived(minValue);
    let price: Price = $derived(new Price(priceValue, currency.abbr));

    function onclick() {
        if (price.value < minValue) {
            return;
        }
        onsubmit(price);
    }
</script>


<div class="giftcard_selection">
    <!-- svelte-ignore a11y_missing_attribute -->
    <a>
        <div class="giftcard_border">
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <div class="giftcard_cont giftcard_gradient" {onclick}>
                <img class="giftcard_corner" src="https://store.fastly.steamstatic.com/public/images/gift/banner_digital_giftcard_blue.png" alt="">
                <div class={["giftcard_text", {small: price.toString().length > 8}]}>
                    {price.toString()}
                </div>
                <img class="steamlogo_overlay" src="https://store.fastly.steamstatic.com/public/images/gift/steam_logo_digitalgiftcard.png" alt="">
                <img class="giftcard_topseller" src={giftcardimage} alt="">
            </div>
            <div style="clear:both;"></div>
            <div class="giftcard_style">
                {L(__wallet_customGiftcard, {"input": ""})}: <!-- TODO translations should remove __input__ -->

                {#if !currency.format.right}
                    {currency.format.symbolFormat}
                {/if}

                <input type="number" min={minValue} {step} bind:value={priceValue}>

                {#if currency.format.right}
                    {currency.format.symbolFormat}
                {/if}
            </div>
        </div>
    </a>
</div>


<style>
    input {
        border: 0;
        background: transparent;
        border-bottom: 1px solid #67c1f5;
        border-radius: 2px;
        color: #ffffff;
        height: 18px;
        padding: 2px 4px 3px 4px;
        width: 54px;
    }

    .giftcard_cont {
        cursor: pointer;
    }

    .giftcard_corner {
        filter: hue-rotate(160deg);
    }

    .giftcard_text {
        font-size: 21px;

        &.small {
            font-size: 14px;
        }
    }
</style>