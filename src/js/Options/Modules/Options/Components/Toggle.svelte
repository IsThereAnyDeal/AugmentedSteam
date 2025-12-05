<script lang="ts">
    import ToggleIcon from "../../Icons/ToggleIcon.svelte";
    import {type Snippet} from "svelte";

    interface Props {
        value: boolean;
        ontoggle?: (toggle: boolean) => void;
        children: Snippet;
    }

    let {
        value = $bindable(),
        ontoggle,
        children
    }: Props = $props();

    function dispatchChange(): void {
        ontoggle?.(value);
    }
</script>


<label>
    <span>
        <input type="checkbox" bind:checked={value} onchange={dispatchChange}>
        <ToggleIcon on={value} />
    </span>

    <span>
        {@render children()}
    </span>
</label>


<style>
    label {
        display: flex;
        padding: 5px 10px;
        gap: 5px;
        align-items: center;
        justify-content: flex-start;
        cursor: pointer;
    }
    label:hover {
        background: #2d303b;
        border-radius: 4px;
    }

    label:hover,
    label:hover :global(i) {
        color: var(--text-bright);
    }

    input {
        display: none;
    }
</style>
