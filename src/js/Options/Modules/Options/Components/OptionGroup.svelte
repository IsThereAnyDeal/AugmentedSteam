<svelte:options immutable={false} />

<script lang="ts">
    export let title: string|undefined = undefined;
</script>


<div class="group">
    {#if title}<div class="title">{title}</div>{/if}
    <slot></slot>
</div>


<style>
    .group {
        padding: 10px 0;
    }

    .group + :global(.group) {
        border-top: 1px solid #262833;
    }

    .title {
        margin-bottom: 5px;
        margin-left: 10px;
    }
</style>
