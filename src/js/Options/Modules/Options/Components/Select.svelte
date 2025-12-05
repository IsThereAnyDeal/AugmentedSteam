<script lang="ts">
    interface Props {
        label?: string;
        options: Array<[string, string]>;
        value: string;
        onchange?: (e: Event) => void
    }

    let {
        label,
        options,
        value = $bindable(),
        onchange
    }: Props = $props();
</script>


<div class="option">
    {#if label}
        <div class="label">{label}</div>
    {/if}

    <select class="inpt" bind:value {onchange}>
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
