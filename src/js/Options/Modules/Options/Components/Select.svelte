<svelte:options immutable={false} />

<script lang="ts">
    export let label: string|undefined = undefined;
    export let options: Array<[string, string]>;
    export let value: string;
</script>


<div class="option">
    {#if label}
        <div class="label">{label}</div>
    {/if}

    <select class="inpt" bind:value on:change>
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
