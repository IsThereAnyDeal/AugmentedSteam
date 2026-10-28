<script lang="ts">
    import {__addSelectedDlcToCart} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Price from "@Content/Modules/Currency/Price";
    import {dlcPriceMap, selectedDlcs} from "@Content/Features/Store/App/DLCCheckboxes/DLCStores.svelte";
    import DOMHelper from "@Content/Modules/DOMHelper";

    function onclick(): void {
        // TODO replace with protobuf call
        DOMHelper.insertScript("scriptlets/Store/App/addItemToCart.js", {
            subids: [...selectedDlcs]
        });
    }

    const price: Price = $derived.by(() => {
        let sum = 0;
        for (const dlc of selectedDlcs) {
            const dlcPrice = dlcPriceMap.get(dlc);
            if (dlcPrice) {
                sum += dlcPrice.value;
            }
        }
        return new Price(sum);
    });
</script>


{#if selectedDlcs.size > 0}
    <div class="game_purchase_action game_purchase_action_bg">
        <div class="game_purchase_price price">{price.toString()}</div>
        <div class="btn_addtocart">
            <button type="button" class="btn_green_steamui btn_medium" {onclick}>
                <span>{L(__addSelectedDlcToCart)}</span>
            </button>
        </div>
    </div>
{/if}


<style>
    .game_purchase_action {
        margin-top: 2px;
    }
</style>