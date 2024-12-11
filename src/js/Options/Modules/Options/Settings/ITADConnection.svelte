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
    import {createEventDispatcher, onMount} from "svelte";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import ITADSyncStatus from "@Content/Modules/Widgets/ITADSync/ITADSyncStatus.svelte";
    import ESyncStatus from "@Core/Sync/ESyncStatus";
    import {type Writable} from "svelte/store";
    import type {SettingsSchema} from "@Options/Data/_types";

    const dispatch = createEventDispatcher<{connection: void}>();

    export let settings: Writable<SettingsSchema>;
    export let isConnected: boolean = false;

    let promise: Promise<void>;

    let statusComponent: ITADSyncStatus;
    let status: ESyncStatus|undefined = undefined;

    function handleAuthorize(): void {
        promise = (async () => {
            await ITADApiFacade.authorize();
            isConnected = true;
            dispatch("connection");
        })();
        statusComponent.updateLastImport();
    }

    function handleDisconnect(): void {
        promise = (async () => {
            await ITADApiFacade.disconnect();
            isConnected = false;
            dispatch("connection");
        })();
        statusComponent.updateLastImport();
    }

    onMount(() => {
        promise = (async () => {
            isConnected = await ITADApiFacade.isConnected();
        })();
        statusComponent.updateLastImport();
    });
</script>


{#await promise}
    {L(__loading)}
{:then _}
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

<div class="info">
    <div class="box box--text">
        <p>{L(__itad_info_itadSteam)}</p>
        <p>{L(__itad_info_steamItad)}</p>
    </div>

    <div class="sync box box--text">
        <ITADSyncStatus {isConnected}
                        enableSync={$settings.itad_sync_library || $settings.itad_sync_wishlist}
                        bind:status bind:this={statusComponent} on:syncEvent />
    </div>
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
        margin: 15px 0;
        display: grid;
        grid-template-columns: auto 160px;
        gap: 15px;
    }

    p {
        margin: 0;
    }
    p + p {
        margin-top: 0.8em;
    }
</style>
