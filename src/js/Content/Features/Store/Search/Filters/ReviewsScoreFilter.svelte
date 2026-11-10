<script lang="ts">
    import {
        __searchFilters_reviewsScore_any,
        __searchFilters_reviewsScore_between,
        __searchFilters_reviewsScore_from,
        __searchFilters_reviewsScore_upTo,
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {type RegisterFilterFn} from "@Content/Features/Store/Search/FSearchFilters";
    import DoubleSlider from "@Content/Features/Store/Search/Filters/DoubleSlider.svelte";

    const min = 0;
    const max = 100;

    interface Props {
        register: RegisterFilterFn
    }

    let { register }: Props = $props();

    let minValue: number = $state(min);
    let maxValue: number = $state(max);
    let enabled: boolean = $derived(minValue > min || maxValue < max);

    function keepRow(row: HTMLElement): boolean {
        if (!enabled) {
            return true;
        }

        if (!row.dataset.asReviewPercentage) {
            let reviewPercentage = -1;

            const reviewsNode = row.querySelector<HTMLElement>(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml?.match(/(?<=%\s?)\d+|\d+(?=\s*%)/);
                if (match) {
                    reviewPercentage = Number(match[0]);
                }
            }

            row.dataset.asReviewPercentage = String(reviewPercentage);
        }

        const score = Number(row.dataset.asReviewPercentage);
        return score === -1 || (minValue <= score && score <= maxValue);
    }

    function onchange(): void {
        register(enabled, keepRow);
    }
</script>


<DoubleSlider {min} {max} step={5} bind:minValue bind:maxValue {onchange}>
    {#if minValue === 0}
        {#if maxValue === max}
            {L(__searchFilters_reviewsScore_any)}
        {:else}
            {L(__searchFilters_reviewsScore_upTo, {score: maxValue})}
        {/if}
    {:else if maxValue === max}
        {L(__searchFilters_reviewsScore_from, {score: minValue})}
    {:else}
        {L(__searchFilters_reviewsScore_between, {lower: minValue, upper: maxValue})}
    {/if}
</DoubleSlider>
