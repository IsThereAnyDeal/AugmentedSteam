<script lang="ts">
    import {__searchFilters_hideEa} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import ToggleFilter from "@Content/Features/Store/Search/Filters/ToggleFilter.svelte";
    import type {RegisterFilterFn} from "@Content/Features/Store/Search/FSearchFilters";

    interface Props {
        register: RegisterFilterFn
    }

    let { register }: Props = $props();

    let active = $state(false);

    function keepRow(row: HTMLElement): boolean {
        return !active || (Boolean(row.dataset.asChecked) && !row.dataset.asEa);
    }

    function onchange(value: boolean) {
        active = value;
        register(value, keepRow);
    }
</script>


<ToggleFilter {active} {onchange}>{L(__searchFilters_hideEa)}</ToggleFilter>
