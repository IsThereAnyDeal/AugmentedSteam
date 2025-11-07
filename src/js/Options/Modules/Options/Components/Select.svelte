<svelte:options immutable={false} />

<script lang="ts">
    import { createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    interface Props {
        label?: string|undefined;
        options: Array<[string, string]>;
        value: string;
    }

    let { label = undefined, options, value = $bindable() }: Props = $props();
</script>


<div class="option">
    {#if label}
        <div class="label">{label}</div>
    {/if}

    <select class="inpt" bind:value onchange={bubble('change')}>
        {#each options as [option, label](option)}
            <option value={option}>{label}</option>
        {/each}
    </select>
</div>


<style>
    .option {
        padding: 5px 10px;
    }

    .label {
        font-size: 0.9em;
        padding-bottom: 5px;
    }
</style>
