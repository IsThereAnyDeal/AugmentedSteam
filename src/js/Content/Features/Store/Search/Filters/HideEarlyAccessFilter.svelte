<script lang="ts">
    import {__searchFilters_hideEa} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import ToggleFilter from "@Content/Features/Store/Search/Filters/ToggleFilter.svelte";
    import {onMount} from "svelte";
    import type {FilterFn} from "@Content/Features/Store/Search/FSearchFilters";
    import FilterState from "@Content/Features/Store/Search/Filters/FilterState.svelte";

    const key = "hide-ea";

    interface Props {
        status: FilterState,
        register: (filter: FilterFn) => void
    }

    let { status, register }: Props = $props();

    function keepRow(row: HTMLElement): boolean {
        return !status.getBoolean(key) || (Boolean(row.dataset.asChecked) && !row.dataset.asEa);
    }

    onMount(() => {
        register(keepRow);
    });
</script>


<ToggleFilter {key} {status}>{L(__searchFilters_hideEa)}</ToggleFilter>
