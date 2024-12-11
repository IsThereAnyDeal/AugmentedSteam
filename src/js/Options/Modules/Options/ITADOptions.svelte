<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __itad_enableSyncLibrary,
        __itad_enableSyncWishlist, __itad_syncEvents,
        __options_addToWaitlist,
        __options_collectionBannerNotOwned,
        __options_userNotes_userNotes,
        __userNote_syncInfo_1,
        __userNote_syncInfo_2,
        __userNote_syncInfo_3,
        __userNote_syncOption,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import ITADConnection from "./Settings/ITADConnection.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import NotesSyncControls from "@Options/Modules/Options/Settings/NotesSyncControls.svelte";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import SyncEvents from "@Options/Modules/Options/Settings/SyncEvents.svelte";
    import {onMount} from "svelte";
    import type {TSyncEvent} from "@Background/Modules/IsThereAnyDeal/_types";

    let settings: Writable<SettingsSchema> = writable(Settings);
    let isConnected: boolean = false;

    let events: TSyncEvent[];

    async function loadSyncEvents(): Promise<void> {
        events = await ITADApiFacade.getSyncEvents();
    }

    onMount(() => {
        loadSyncEvents();
    });
</script>


<div>
    <Section title="IsThereAnyDeal">
        <OptionGroup>
            <ITADConnection {settings} bind:isConnected
                            on:syncEvent={loadSyncEvents}
                            on:connection={loadSyncEvents}
            />
        </OptionGroup>
    </Section>

    <Section title="Collection">
        <OptionGroup>
            <Toggle bind:value={$settings.itad_sync_library}>{L(__itad_enableSyncLibrary)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.collection_banner_notowned}>{L(__options_collectionBannerNotOwned)}</Toggle>
        </OptionGroup>
    </Section>

    <Section title="Waitlist">
        <OptionGroup>
            <Toggle bind:value={$settings.itad_sync_wishlist}>{L(__itad_enableSyncWishlist)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.add_to_waitlist}>{L(__options_addToWaitlist)}</Toggle>
        </OptionGroup>
    </Section>

    <Section title={L(__options_userNotes_userNotes)}>
        <div class="box box--text">
            <p>{L(__userNote_syncInfo_1)}</p>
            <p>{L(__userNote_syncInfo_2)}</p>
            <p>{L(__userNote_syncInfo_3)}</p>
        </div>

        <OptionGroup>
            <NotesSyncControls {isConnected} on:syncEvent={loadSyncEvents} />
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.itad_sync_notes}>{L(__userNote_syncOption)}</Toggle>
        </OptionGroup>
    </Section>

    {#if events}
        <Section title={L(__itad_syncEvents)}>
            <SyncEvents {events} />
        </Section>
    {/if}
</div>
