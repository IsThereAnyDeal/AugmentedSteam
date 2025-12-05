<script lang="ts">
    import ColorPicker from "./ColorPicker.svelte";
    import Toggle from "./Toggle.svelte";
    import type {Snippet} from "svelte";

    interface Props {
        enabled: boolean;
        color: string;
        defaultColor: string;
        children: Snippet;
    }

    let {
        enabled = $bindable(),
        color = $bindable(),
        defaultColor,
        children
    }: Props = $props();
</script>


<div>
    <ColorPicker bind:value={color} {defaultColor} />

    <span class="option">
        <Toggle bind:value={enabled}>{@render children()}</Toggle>
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
