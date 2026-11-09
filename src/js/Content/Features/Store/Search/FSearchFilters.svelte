<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__filters} from "@Strings/_strings";
    import type {FilterFn} from "@Content/Features/Store/Search/FSearchFilters";
    import HideMixedReviewsFilter from "@Content/Features/Store/Search/Filters/HideMixedReviewsFilter.svelte";
    import type FilterState from "@Content/Features/Store/Search/Filters/FilterState.svelte";
    import HideNegativeReviewsFilter from "@Content/Features/Store/Search/Filters/HideNegativeReviewsFilter.svelte";
    import HideInCartFilter from "@Content/Features/Store/Search/Filters/HideInCartFilter.svelte";
    import ReviewsScoreFilter from "@Content/Features/Store/Search/Filters/ReviewsScoreFilter.svelte";
    import DiscountFilter from "@Content/Features/Store/Search/Filters/DiscountFilter.svelte";
    import ReviewsCountFilter from "@Content/Features/Store/Search/Filters/ReviewsCountFilter.svelte";
    import HideEarlyAccessFilter from "@Content/Features/Store/Search/Filters/HideEarlyAccessFilter.svelte";

    interface Props {
        collapseName: string,
        status: FilterState,
        register: (filter: FilterFn) => void
    }

    let { collapseName, status, register }: Props = $props();
</script>


<div class="block search_collapse_block" data-collapse-name={collapseName}>
    <div class="block_header"><div>{L(__filters)}</div></div>
    <div class="block_content block_content_inner">
        <HideInCartFilter {status} {register} />
        <HideMixedReviewsFilter {status} {register} />
        <HideNegativeReviewsFilter {status} {register} />
        <HideEarlyAccessFilter {status} {register} />

        <div class="block_rule"></div>
        <ReviewsScoreFilter {status} {register} />

        <div class="block_rule"></div>
        <ReviewsCountFilter {status} {register} />

        <div class="block_rule"></div>
        <DiscountFilter {status} {register} />
    </div>
</div>