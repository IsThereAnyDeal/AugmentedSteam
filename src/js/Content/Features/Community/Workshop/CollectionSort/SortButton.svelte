<script lang="ts">
    import {
        type SortConfig,
        ESortCriteria,
        type SortDirection
    } from "@Content/Features/Community/Workshop/CollectionSort/_types";
    import CaretDownIcon from "@Content/Icons/CaretDownIcon.svelte";
    import CaretUpIcon from "@Content/Icons/CaretUpIcon.svelte";

    export let by: ESortCriteria;
    export let dir: SortDirection;
    export let config: SortConfig;
    export let toggle: (by: ESortCriteria, defaultDir: SortDirection) => void;

    let currentDir: number|null;
    $: currentDir = config.get(by) ?? null;
</script>


<button class:active={config.has(by)} on:click={() => toggle(by, dir)}>
    <slot></slot><!--

    -->{#if (currentDir && currentDir < 0) || (!currentDir && dir < 0)}
        <CaretDownIcon />
    {:else}
        <CaretUpIcon />
    {/if}
</button>


<style>
    button {
        background: transparent;
        color: #67c1f5;
        font-size: 13px;
        cursor: pointer;
        padding: 0;
        margin: 0;
        border: 0;
        outline: 0;
    }
    button:hover {
        color: #a4d7f5;
    }

    button.active {
        color: #fff;
    }

    button :global(i) {
        opacity: 0.2;
    }
    button.active :global(i) {
        opacity: 1;
    }
</style>