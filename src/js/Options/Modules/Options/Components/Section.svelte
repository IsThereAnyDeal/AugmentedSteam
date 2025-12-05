<script lang="ts">
    import type {Snippet} from "svelte";

    interface Props {
        title?: string;
        children: Snippet;
    }

    let { title, children }: Props = $props();
</script>


<section>
    {#if title}<h2>{title}</h2>{/if}
    {@render children()}
</section>


<style>
    section {
        padding: 15px;
    }
</style>
