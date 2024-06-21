<svelte:options immutable={false} />

<script lang="ts">
    import {slide} from "svelte/transition";
</script>


<div class="box" transition:slide={{axis: "y", duration: 200}}>
    <slot></slot>
</div>


<style>
    div {
        margin: 10px 0 10px 40px;
    }
</style>
