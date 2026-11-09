<script lang="ts">
    import {__searchFilters_discountPercent_count,} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {type FilterFn} from "@Content/Features/Store/Search/FSearchFilters";
    import DoubleSlider from "@Content/Features/Store/Search/Filters/DoubleSlider.svelte";
    import type FilterState from "@Content/Features/Store/Search/Filters/FilterState.svelte";
    import {onMount} from "svelte";

    const key = "discount";
    const min = 0;
    const max = 100;

    interface Props {
        status: FilterState,
        register: (filter: FilterFn) => void
    }

    let { status, register }: Props = $props();

    let [currentMin, currentMax] = $derived(status.getRange(key));

    let minValue = $derived(currentMin ?? min);
    let maxValue = $derived(currentMax ?? max);

    function keepRow(row: HTMLElement): boolean {
        if (minValue === min && maxValue === max) {
            return true;
        }

        const discount = Number(row.querySelector<HTMLElement>(".search_discount_block")?.dataset.discount ?? 0);
        return (minValue <= discount && discount <= maxValue);
    }

    function onchange(): void {
        const newMin = minValue === min ? null : minValue;
        const newMax = maxValue === max ? null : maxValue;
        status.setRange(key, newMin, newMax);
    }

    onMount(() => {
        register(keepRow);
    });
</script>


<DoubleSlider {min} {max} step={1} bind:minValue bind:maxValue {onchange}>
    {L(__searchFilters_discountPercent_count)} {minValue}% - {maxValue}%
</DoubleSlider>
