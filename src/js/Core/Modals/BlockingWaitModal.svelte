<svelte:options accessors />

<script lang="ts">
    export let status: string|string[];
</script>


{#if typeof status === "string"}
    {status}
{:else}
    {#each status as statusStr}
        <div>{statusStr}</div>
    {/each}
{/if}
