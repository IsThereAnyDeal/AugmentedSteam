<script lang="ts">
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import {L} from "@Core/Localization/Localization";
    import {__itad_from, __itad_lastImport, __itad_syncNow, __itad_to, __loading, __never} from "@Strings/_strings";
    import ESyncStatus from "@Core/Sync/ESyncStatus";
    import SyncIndicator from "@Core/Sync/SyncIndicator.svelte";
    import {fade} from "svelte/transition";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{syncEvent: void}>();

    export let isConnected: boolean;
    export let enableSync: boolean;
    export let status: ESyncStatus = ESyncStatus.OK;

    let from: number|null = null;
    let to: number|null = null;

    export async function updateLastImport(): Promise<void> {
        const last = await ITADApiFacade.getLastImport();
        from = last.from;
        to = last.to;
    }

    async function syncNow(): Promise<void> {
        status = ESyncStatus.Loading;

        try {
            await ITADApiFacade.sync(true);
            status = ESyncStatus.OK;
            await updateLastImport();
            dispatch("syncEvent");
        } catch (e) {
            status = ESyncStatus.Error;

            console.group("ITAD sync");
            console.error("Failed to sync with ITAD");
            console.error(e);
            console.groupEnd();
        }
    }
</script>


<div class="asi-container">
    <div class="asi-head">{L(__itad_lastImport)}</div>

    <div class="asi-status">
        <div class="asi-label">{L(__itad_from)}</div>
        {from ? new Date(from * 1000).toLocaleString() : L(__never)}
    </div>

    <div class="asi-status">
        <div class="asi-label">{L(__itad_to)}</div>
        {to ? new Date(to * 1000).toLocaleString() : L(__never)}
    </div>

    {#if isConnected && enableSync}
        <div transition:fade={{duration: 200}}>
            {#if status === ESyncStatus.Loading}
                <span><SyncIndicator status={ESyncStatus.Loading} /> {L(__loading)}</span>
            {:else}
                <button type="button" class="asi__sync-now" on:click={syncNow}>{L(__itad_syncNow)}</button>
            {/if}
        </div>
    {/if}
</div>


<style>
    .asi-container {
        line-height: 1.25;
        color: #c6d4df;
    }

    .asi-head {
        font-size: 14px;
        margin-bottom: 15px;
    }

    .asi-status {
        line-height: 1.25;
        font-size: 13px;
        margin: 15px 0;
    }
    .asi-label {
        font-family: Arial, Helvetica, sans-serif;
        text-transform: uppercase;
        font-size: 10px;
        color: #8f98a0;
    }

    button {
        cursor: pointer;
        text-decoration: underline;
        background: none;
        outline: 0;
        border: 0;
        font-size: 12px;
        font-family: inherit;
        color: inherit;
        font-weight: inherit;
        text-align: left;
    }
    button:hover {
        color: white;
    }
</style>
