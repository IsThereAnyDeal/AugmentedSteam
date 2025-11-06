<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __thewordclear,
        __workshop_collectionSortAuthor,
        __workshop_collectionSortBy,
        __workshop_collectionSortRating,
        __workshop_collectionSortSubscription,
        __workshop_collectionSortTitle
    } from "@Strings/_strings";
    import {type SortConfig, ESortCriteria, type SortDirection} from "@Content/Features/Community/Workshop/CollectionSort/_types";
    import SortButton from "@Content/Features/Community/Workshop/CollectionSort/SortButton.svelte";
    import ClearIcon from "@Content/Icons/ClearIcon.svelte";

    export let handler: (config: SortConfig) => void;

    let config: SortConfig = new Map<ESortCriteria, SortDirection>();

    function toggle(by: ESortCriteria, defaultDir: SortDirection): void {
        const dir = config.get(by) ?? null;
        if (dir === null) {
            config.set(by, defaultDir);
        } else if (dir === defaultDir) {
            config.set(by, -defaultDir as SortDirection)
        } else {
            config.delete(by);
        }
        config = config;

        handler(config);
    }

    function reset() {
        config.clear();
        config = config;

        handler(config);
    }
</script>


<div>
    <span class="label">{L(__workshop_collectionSortBy)}</span>

    <SortButton {config} {toggle} dir={-1} by={ESortCriteria.Subscription}>
        {L(__workshop_collectionSortSubscription)}
    </SortButton>
    <SortButton {config} {toggle} dir={-1} by={ESortCriteria.Rating}>
        {L(__workshop_collectionSortRating)}
    </SortButton>
    <SortButton {config} {toggle} dir={1} by={ESortCriteria.Title}>
        {L(__workshop_collectionSortTitle)}
    </SortButton>
    <SortButton {config} {toggle} dir={1} by={ESortCriteria.Author}>
        {L(__workshop_collectionSortAuthor)}
    </SortButton>

    <button class="reset" on:click={reset}>
        {L(__thewordclear)} <ClearIcon />
    </button>
</div>


<style>
    div {
        clear: both;
        margin: 16px 0 12px 0;
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
    }

    .label {
        color: #8b8b8b;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-right: 4px;
    }

    .reset {
        background: transparent;
        color: #8b8b8b;
        font-size: 13px;
        cursor: pointer;
        padding: 0;
        margin: 0;
        border: 0;
        outline: 0;
    }
    .reset:hover {
        color: #fff;
    }
</style>