<svelte:options immutable={false} />

<script lang="ts">
    import ToggleIcon from "../../Icons/ToggleIcon.svelte";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{toggle: boolean}>();

    interface Props {
        value: boolean;
        children?: import('svelte').Snippet;
    }

    let { value = $bindable(), children }: Props = $props();

    function dispatchChange(): void {
        dispatch("toggle", value);
    }
</script>


<label>
    <span>
        <input type="checkbox" bind:checked={value} onchange={dispatchChange}>
        <ToggleIcon on={value} />
    </span>

    <span>
        {@render children?.()}
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
