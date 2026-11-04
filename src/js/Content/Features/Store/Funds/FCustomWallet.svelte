<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__wallet_customAmount, __wallet_customAmountText} from "@Strings/_strings";
    import Price from "@Content/Modules/Currency/Price";
    import type {TCurrency} from "@Core/Currencies";

    interface Props {
        currency: TCurrency,
        minValue: number,
        onsubmit: (price: Price) => void
    }

    let { currency, minValue, onsubmit }: Props = $props();

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


<div class="addfunds_area_purchase_game game_area_purchase_game">
    <div class="addfunds_purchase_action game_purchase_action" style="float: right">
        <div class="game_purchase_action_bg">
            <div class="game_purchase_price price">
                {#if !currency.format.right}
                    {currency.format.symbolFormat}
                {/if}

                <input type="number" min={minValue} {step} bind:value={priceValue}>

                {#if currency.format.right}
                    {currency.format.symbolFormat}
                {/if}
            </div>

            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_missing_attribute, a11y_no_static_element_interactions -->
            <a class="btnv6_green_white_innerfade btn_medium" {onclick}><span>Add funds</span></a>
        </div>
    </div>

    <h1>{L(__wallet_customAmount)}: {price.toString()}</h1>
    <p>{L(__wallet_customAmountText, {minamount: price.toString()})}</p>
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
</style>