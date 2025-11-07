<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>


<i>{@render children?.()}</i>


<style>
    i {
        display: inline-block;
        line-height: 1;
        width: 1.2em;
        vertical-align: bottom;
    }

    i :global(svg) {
        overflow: visible;
        vertical-align: bottom;
        fill: currentColor;
    }
</style>
