<svelte:options accessors />

<script lang="ts">
    import {__wait} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let status: string|string[] = L(__wait);
</script>


{#if typeof status === "string"}
    {status}
{:else}
    {#each status as statusStr}
        <div>{statusStr}</div>
    {/each}
{/if}
