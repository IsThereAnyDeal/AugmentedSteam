<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__itad_import, __libraryMenu, __options_addToWaitlist, __wishlist,} from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import ITADConnection from "./Settings/ITADConnection.svelte";
    import type {SettingsSchema} from "../../Data/_types";

    let settings: Writable<SettingsSchema> = writable(Settings);
</script>


<div>
    <Section title="IsThereAnyDeal">
        <OptionGroup>
            <ITADConnection />
        </OptionGroup>

        <OptionGroup title={L(__itad_import)}>
            <Toggle bind:value={$settings.itad_import_library}>{L(__libraryMenu)}</Toggle>
            <Toggle bind:value={$settings.itad_import_wishlist}>{L(__wishlist)}</Toggle>
            <Toggle bind:value={$settings.add_to_waitlist}>{L(__options_addToWaitlist)}</Toggle>
        </OptionGroup>
    </Section>
</div>
