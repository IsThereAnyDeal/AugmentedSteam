<script lang="ts">
    import {__searchFilters_discountPercent_count,} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import DoubleSlider from "@Content/Features/Store/Search/Filters/DoubleSlider.svelte";
    import type {RegisterFilterFn} from "@Content/Features/Store/Search/FSearchFilters";

    const min = 0;
    const max = 100;

    interface Props {
        register: RegisterFilterFn
    }

    let { register }: Props = $props();

    let minValue = $state(min);
    let maxValue = $state(max);
    let enabled: boolean = $derived(minValue > min || maxValue < max);

    function keepRow(row: HTMLElement): boolean {
        if (!enabled) {
            return true;
        }

        const discount = Number(row.querySelector<HTMLElement>(".search_discount_block")?.dataset.discount ?? 0);
        return (minValue <= discount && discount <= maxValue);
    }

    function onchange(): void {
        register(enabled, keepRow);
    }
</script>


<DoubleSlider {min} {max} step={1} bind:minValue bind:maxValue {onchange}>
    {L(__searchFilters_discountPercent_count)} {minValue}% - {maxValue}%
</DoubleSlider>
