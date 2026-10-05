<svelte:options immutable={false} />

<script lang="ts">
    interface Props {
        title?: string|undefined;
        children?: import('svelte').Snippet;
    }

    let { title = undefined, children }: Props = $props();
</script>


<div class="group">
    {#if title}<div class="title">{title}</div>{/if}
    {@render children?.()}
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
