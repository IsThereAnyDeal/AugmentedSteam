<script lang="ts">
    import ToggleIcon from "../../Icons/ToggleIcon.svelte";

    export let value: boolean;
</script>


<label>
    <span>
        <input type="checkbox" bind:checked={value}>
        <ToggleIcon on={value} />
    </span>

    <span>
        <slot></slot>
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
