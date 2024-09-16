<script lang="ts">
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import UserNotesAdapter from "@Content/Modules/UserNotes/UserNotesAdapter";
    import SyncPushIcon from "@Options/Modules/Icons/SyncPushIcon.svelte";
    import SyncPullIcon from "@Options/Modules/Icons/SyncPullIcon.svelte";
    import {slide} from "svelte/transition";
    import {L} from "@Core/Localization/Localization";
    import {
        __loading,
        __userNote_syncButtonPull,
        __userNote_syncButtonPush,
        __userNote_syncFailed,
        __userNote_syncPulled,
        __userNote_syncPushed
    } from "@Strings/_strings";
    import type {TPushNotesStatus} from "@Background/Modules/IsThereAnyDeal/_types";
    import SyncIndicator from "@Core/Sync/SyncIndicator.svelte";
    import ESyncStatus from "@Core/Sync/ESyncStatus";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{syncEvent: void}>();

    export let isConnected: boolean;

    let loading: boolean = false;
    let pullCount: number|null = null;
    let pushStatus: TPushNotesStatus|null = null;

    async function pullNotes(): Promise<void> {
        if (loading || !isConnected) {
            return;
        }

        loading = true;
        pullCount = null;
        pushStatus = null;

        pullCount = await ITADApiFacade.pullNotes();
        loading = false;

        dispatch("syncEvent");
    }

    async function pushNotes(): Promise<void> {
        if (loading || !isConnected) {
            return;
        }

        loading = true;
        pullCount = null;
        pushStatus = null;

        const adapter = UserNotesAdapter.getAdapter();
        const notes = await adapter.export();

        pushStatus = await ITADApiFacade.pushNotes(
            [...Object.entries(notes)].map(([appid, note]) => [Number(appid), note])
        );

        loading = false;

        dispatch("syncEvent");
    }
</script>


<div class="buttons" class:is-disabled={loading || !isConnected}>
    <button type="button" on:click={pushNotes}>
        <span>{L(__userNote_syncButtonPush)}</span>
        <SyncPushIcon />
    </button>

    <button type="button" on:click={pullNotes}>
        <span>{L(__userNote_syncButtonPull)}</span>
        <SyncPullIcon />
    </button>
</div>


{#if loading || pullCount !== null || pushStatus}
    <div class="status" transition:slide={{axis: "y", duration: 100}}>
        {#if loading}
            <span class="indicator"><SyncIndicator status={ESyncStatus.Loading} /></span>
            {L(__loading)}
        {/if}

        {#if pullCount !== null}
            <span class="indicator"><SyncIndicator status={ESyncStatus.OK} /></span>
            {L(__userNote_syncPulled, {n: pullCount})}
        {/if}

        {#if pushStatus}
            <span class="indicator"><SyncIndicator status={ESyncStatus.OK} /></span>
            {L(__userNote_syncPushed, {n: pushStatus.pushed})}

            {#if pushStatus.errors.length > 0}
                <div class="error">
                    <div>
                        <span class="indicator"><SyncIndicator status={ESyncStatus.Error} /></span>
                        {L(__userNote_syncFailed, {n: pushStatus.errors.length})}
                    </div>
                    <div class="error-list">
                        {#each pushStatus.errors as [appid, error, params]}
                            <a href="https://store.steampowered.com/app/{appid}">app/{appid}</a>
                            <div>{L(error, params)}</div>
                        {/each}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
{/if}


<style>
    .buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        transition: opacity 100ms;
    }
    .buttons.is-disabled {
        pointer-events: none;
        opacity: 0.2;
    }

    button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px 15px;
        border-radius: 8px;
        background: #1a1c21;
        border: 1px solid #333643;
        text-align: left;
        color: var(--text-color);
        min-width: 220px;
    }
    button:hover {
        border: 1px solid #3c404e;
        color: var(--text-bright);
    }

    button span {
        display: block;
        white-space: preserve-breaks;
    }

    button :global(i) {
        fill: #333643;
        width: 40px;
    }
    button:hover :global(i) {
        fill: var(--text-color);
    }


    .status {
        padding: 15px;
        margin: 30px;
        line-height: 1.5;
        background: #1a1c21;
        border: 1px dashed #333643;
        border-radius: 10px;
    }

    .indicator {
        margin-right: 5px;
    }

    .error-list {
        display: grid;
        grid-template-columns: 70px auto;
        gap: 5px;
        line-height: 1.75;
        font-size: 12px;
        margin: 5px 15px;
    }
</style>
