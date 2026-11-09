<script lang="ts">
    import {
        __searchFilters_reviewsCount_count,
        __searchFilters_reviewsCount_maxCount,
        __searchFilters_reviewsCount_minCount,
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {type FilterFn} from "@Content/Features/Store/Search/FSearchFilters";
    import type FilterState from "@Content/Features/Store/Search/Filters/FilterState.svelte";
    import {onMount} from "svelte";

    const key = "reviews-count";

    interface Props {
        status: FilterState,
        register: (filter: FilterFn) => void
    }

    let { status, register }: Props = $props();

    let [currentMin, currentMax] = $derived(status.getRange(key));

    let minValue: number|null = $derived(currentMin);
    let maxValue: number|null = $derived(currentMax);

    function keepRow(row: HTMLElement): boolean {
        if (minValue === null && maxValue === null) {
            return true;
        }

        if (!row.dataset.asReviewCount) {
            let reviewCount = -1;

            const reviewsNode = row.querySelector<HTMLElement>(".search_review_summary");
            if (reviewsNode) {
                const match = reviewsNode.dataset.tooltipHtml?.match(/(?<!%\s*[\d,]*)\d[\d,]+(?![\d,]*\s*%)/);
                if (match) {
                    reviewCount = Number(match[0].replace(/,/g, ""));
                }
            }

            row.dataset.asReviewCount = String(reviewCount);
        }

        const count = Number(row.dataset.asReviewCount);
        return count === -1
            || ((minValue === null || minValue <= count) && (maxValue === null || count <= maxValue));
    }

    function onchange(): void {
        status.setRange(key, minValue, maxValue);
    }

    onMount(() => {
        register(keepRow);
    });
</script>


<div>
    <div class="as-header">{L(__searchFilters_reviewsCount_count)}</div>
    <div class="as-content">
        <input type="number" autocomplete="off" min={0} placeholder={L(__searchFilters_reviewsCount_minCount)} bind:value={minValue} {onchange}>
        &mdash;
        <input type="number" autocomplete="off" min={0} placeholder={L(__searchFilters_reviewsCount_maxCount)} bind:value={maxValue} {onchange}>
    </div>
</div>



<style>
    .as-header {
        margin-left: 8px;
        font-size: 13px;
        font-family: "Motiva Sans", Sans-serif;
        color: #9fbbcb;
    }

    .as-content {
        display: flex;
        align-items: center;
        padding: 0 12px;
        margin-top: 5px;
    }

    input {
        min-width: 0;
        background-color: rgba(0, 0, 0, 0.2);
        color: #fff;
        border-radius: 3px;
        border: 1px solid rgba( 0, 0, 0, 0.3);
        box-shadow: 1px 1px 0 rgba( 255, 255, 255, 0.2);
        padding: 5px;
        margin: 5px;
        appearance: textfield;

        &::placeholder {
            font-style: italic;
            color: #7092a5;
        }
    }
</style>