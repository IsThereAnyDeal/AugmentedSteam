<svelte:options immutable={false} />

<script lang="ts">
    export let title: string|undefined = undefined;
</script>


<section>
    {#if title}<h2>{title}</h2>{/if}
    <slot></slot>
</section>


<style>
    section {
        padding: 15px;
    }
</style>
