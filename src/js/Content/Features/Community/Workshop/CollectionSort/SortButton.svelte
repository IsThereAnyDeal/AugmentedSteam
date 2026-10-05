<script lang="ts">
    import {
        type SortConfig,
        ESortCriteria,
        type SortDirection
    } from "@Content/Features/Community/Workshop/CollectionSort/_types";
    import CaretDownIcon from "@Content/Icons/CaretDownIcon.svelte";
    import CaretUpIcon from "@Content/Icons/CaretUpIcon.svelte";

    interface Props {
        by: ESortCriteria;
        dir: SortDirection;
        config: SortConfig;
        toggle: (by: ESortCriteria, defaultDir: SortDirection) => void;
        children?: import('svelte').Snippet;
    }

    let {
        by,
        dir,
        config,
        toggle,
        children
    }: Props = $props();

    let currentDir: number|null = $derived(config.get(by) ?? null);
    
</script>


<button class:active={config.has(by)} onclick={() => toggle(by, dir)}>
    {@render children?.()}<!--

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