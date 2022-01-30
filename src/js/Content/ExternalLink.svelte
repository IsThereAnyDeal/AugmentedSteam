<script lang="ts">
    import {SyncedStorage} from "../modulesCore"

    const allowOpenInNewTab = SyncedStorage.get("openinnewtab");
</script>

{#if allowOpenInNewTab}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a target="_blank" rel="noreferrer noopener" {...$$props}>
        <slot></slot>
    </a>
{:else}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a {...$$props}>
        <slot></slot>
    </a>
{/if}