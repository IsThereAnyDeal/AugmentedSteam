<svelte:options immutable={false} />

<script lang="ts">
    interface Props {
        title?: string|undefined;
        children?: import('svelte').Snippet;
    }

    let { title = undefined, children }: Props = $props();
</script>


<section>
    {#if title}<h2>{title}</h2>{/if}
    {@render children?.()}
</section>


<style>
    section {
        padding: 15px;
    }
</style>
