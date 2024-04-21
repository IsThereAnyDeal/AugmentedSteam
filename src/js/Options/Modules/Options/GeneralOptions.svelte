<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __hide,
        __language,
        __options_contextBartervg,
        __options_contextItad,
        __options_contextMenu,
        __options_contextSteamdb,
        __options_contextSteamdbInstant,
        __options_contextSteamKeys,
        __options_contextSteamMarket,
        __options_contextSteamStore,
        __options_disablelinkfilter,
        __options_general, __options_hidetmsymbols,
        __options_installSteamButton,
        __options_openinnewtab,
        __options_replaceViewClient,
        __options_sendAgeInfo,
        __options_showBacktotop,
        __options_versionShow,
        __show,
        __showProgressbar,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import Select from "./Components/Select.svelte";
    import type {TSettings} from "../../Data/_types";
    import LanguageWarningSetting from "./Settings/LanguageWarningSetting.svelte";
    import OptionGroup from "./Components/OptionGroup.svelte";

    let settings: Writable<TSettings> = writable(Settings);
</script>


<div>
    <Section title={L(__options_general)}>
        <OptionGroup>
            <Toggle bind:value={$settings.show_progressbar}>{L(__showProgressbar)}</Toggle>
            <Toggle bind:value={$settings.version_show}>{L(__options_versionShow)}</Toggle>
            <Toggle bind:value={$settings.show_backtotop}>{L(__options_showBacktotop)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.hidetmsymbols}>{L(__options_hidetmsymbols)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.send_age_info}>{L(__options_sendAgeInfo)}</Toggle>
            <Toggle bind:value={$settings.disablelinkfilter}>{L(__options_disablelinkfilter)}</Toggle>
            <Toggle bind:value={$settings.openinnewtab}>{L(__options_openinnewtab)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <LanguageWarningSetting {settings} />
        </OptionGroup>

        <OptionGroup>
            <Select bind:value={$settings.installsteam} label={L(__options_installSteamButton)} options={[
                ["show", L(__show)],
                ["hide", L(__hide)],
                ["replace", L(__options_replaceViewClient)]
            ]} />
        </OptionGroup>
    </Section>

    <Section title={L(__options_contextMenu)}>
        <Toggle bind:value={$settings.context_steam_store}>{L(__options_contextSteamStore, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_steam_market}>{L(__options_contextSteamMarket, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_itad}>{L(__options_contextItad, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_bartervg}>{L(__options_contextBartervg, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_steamdb}>{L(__options_contextSteamdb, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_steamdb_instant}>{L(__options_contextSteamdbInstant, {query: "..."})}</Toggle>
        <Toggle bind:value={$settings.context_steam_keys}>{L(__options_contextSteamKeys)}</Toggle>
    </Section>
</div>
