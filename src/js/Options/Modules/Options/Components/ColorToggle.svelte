<svelte:options immutable={false} />

<script lang="ts">
    import ColorPicker from "./ColorPicker.svelte";
    import Toggle from "./Toggle.svelte";

    export let enabled: boolean;
    export let color: string;
    export let defaultColor: string;
</script>


<div>
    <ColorPicker bind:value={color} {defaultColor} />

    <span class="option">
        <Toggle bind:value={enabled}><slot></slot></Toggle>
    </span>
</div>


<style>
    div {
        display: flex;
        gap: 5px;
        justify-content: flex-start;
        align-items: center;
    }

    .option {
        flex-grow: 1;
    }
</style>
