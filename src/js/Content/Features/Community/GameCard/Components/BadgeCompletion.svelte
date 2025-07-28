<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__badgeCompletionCost} from "@Strings/_strings";
    import Price from "@Content/Modules/Currency/Price";

    let cost: number = 0;
    let full: boolean = false;

    export function update(costMap: Map<string, Price|null>) {
        console.log(costMap);

        full = true;
        for (const price of costMap.values()) {
            if (price === null) {
                full = false;
            } else {
                cost += price.value;
            }
        }
    }
</script>


{#if cost > 0}
    <div class="badge_info_unlocked">
        {L(__badgeCompletionCost, {"cost": (new Price(cost)).toString()})}<!--
        -->{#if !full}+{/if}
    </div>
{/if}
