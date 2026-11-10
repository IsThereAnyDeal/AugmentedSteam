<script lang="ts">
    import {__searchFilters_hideNegative} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import ToggleFilter from "@Content/Features/Store/Search/Filters/ToggleFilter.svelte";
    import type {RegisterFilterFn} from "@Content/Features/Store/Search/FSearchFilters";

    interface Props {
        register: RegisterFilterFn
    }

    let { register }: Props = $props();

    let active: boolean = $state(false);

    function keepRow(row: HTMLElement): boolean {
        return !active || row.querySelector(".search_review_summary.negative") === null;
    }

    function onchange(value: boolean) {
        active = value;
        register(value, keepRow);
    }
</script>


<ToggleFilter {active} {onchange}>{L(__searchFilters_hideNegative)}</ToggleFilter>
