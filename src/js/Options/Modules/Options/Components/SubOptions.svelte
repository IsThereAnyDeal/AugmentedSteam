<script lang="ts">
    import {slide} from "svelte/transition";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>


<div class="box" transition:slide={{axis: "y", duration: 200}}>
    {@render children?.()}
</div>


<style>
    div {
        margin: 10px 0 10px 40px;
    }
</style>
