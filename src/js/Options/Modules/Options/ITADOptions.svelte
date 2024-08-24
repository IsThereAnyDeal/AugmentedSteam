<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __itad_import,
        __libraryMenu,
        __options_addToWaitlist,
        __options_collectionBannerNotOwned, __userNote_syncInfo_1, __userNote_syncInfo_2, __userNote_syncInfo_3,
        __userNote_syncOption,
        __wishlist,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import ITADConnection from "./Settings/ITADConnection.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import NotesSyncControls from "@Options/Modules/Options/Settings/NotesSyncControls.svelte";

    let settings: Writable<SettingsSchema> = writable(Settings);
    let isConnected: boolean;
</script>


<div>
    <Section title="IsThereAnyDeal">
        <OptionGroup>
            <ITADConnection bind:isConnected />
        </OptionGroup>

        <OptionGroup title={L(__itad_import)}>
            <Toggle bind:value={$settings.itad_import_library}>{L(__libraryMenu)}</Toggle>
            <Toggle bind:value={$settings.itad_import_wishlist}>{L(__wishlist)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.add_to_waitlist}>{L(__options_addToWaitlist)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.collection_banner_notowned}>{L(__options_collectionBannerNotOwned)}</Toggle>
        </OptionGroup>

    </Section>

    <Section title="Notes">
        <div class="box box--text">
            <p>{L(__userNote_syncInfo_1)}</p>
            <p>{L(__userNote_syncInfo_2)}</p>
            <p>{L(__userNote_syncInfo_3)}</p>
        </div>

        <OptionGroup>
            <NotesSyncControls {isConnected} />
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.itad_sync_notes}>{L(__userNote_syncOption)}</Toggle>
        </OptionGroup>
    </Section>
</div>
