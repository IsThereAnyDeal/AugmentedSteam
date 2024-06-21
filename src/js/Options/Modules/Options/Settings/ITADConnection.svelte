<svelte:options immutable={false} />

<script lang="ts">
    import {
        __connected,
        __disconnected,
        __error,
        __itad_info_itadSteam,
        __itad_info_steamItad,
        __loading,
        __status
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";

    let promise: Promise<boolean>;

    function handleAuthorize(): void {
        promise = (async () => {
            await ITADApiFacade.authorize();
            return true;
        })();
    }

    function handleDisconnect(): void {
        promise = (async () => {
            await ITADApiFacade.disconnect();
            return false;
        })();
    }

    onMount(() => {
        promise = ITADApiFacade.isConnected();
    });
</script>


{#await promise}
    {L(__loading)}
{:then isConnected}
    {#if isConnected}
        <button type="button" on:click={handleDisconnect}>
            <span class="label">{L(__status)}</span>
            <span class="status is-connected">{L(__connected)}</span>
        </button>
    {:else}
        <button type="button" on:click={handleAuthorize}>
            <span class="label">{L(__status)}</span>
            <span class="status">{L(__disconnected)}</span>
        </button>
    {/if}
{:catch e_}
    {L(__error)}
{/await}

<div class="box info">
    <p>{L(__itad_info_itadSteam)}</p>
    <p>{L(__itad_info_steamItad)}</p>
</div>


<style>
    button {
        gap: 0 50px ;
        padding: 15px;
        border-radius: 8px;
        background: #1a1c21;
        border: 1px solid #333643;
        text-align: left;
        align-items: center;
        color: var(--text-bright);
        width: 200px;
    }
    button:hover {
        border: 1px solid #3c404e;
    }

    .label {
        font-size: 0.85em;
    }

    .status {
        display: block;
        font-size: 1.2em;
        color: var(--color-error);
    }
    .is-connected {
        color: var(--color-success);
    }


    .info {
        font-size: 0.92em;
        margin: 15px 0;
        line-height: 1.5;
    }

    p {
        margin: 0;
    }
    p + p {
        margin-top: 0.8em;
    }
</style>
