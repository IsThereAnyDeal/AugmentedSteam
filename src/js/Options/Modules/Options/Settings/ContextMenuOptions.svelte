<script lang="ts">
    import type {Writable} from "svelte/store";
    import type {SettingsSchema} from "../../../Data/_types";
    import {
        __options_contextBartervg,
        __options_contextItad,
        __options_contextSteamdb,
        __options_contextSteamdbInstant,
        __options_contextSteamKeys,
        __options_contextSteamLucky,
        __options_contextSteamMarket,
        __options_contextSteamStore
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Toggle from "../Components/Toggle.svelte";
    import ContextMenu, {type ContextMenuKeys} from "@Background/Modules/ContextMenu/ContextMenu";

    interface Props {
        settings: Writable<SettingsSchema>;
    }

    let { settings }: Props = $props();

    async function handleChange(key: ContextMenuKeys, value: boolean): Promise<void> {
        $settings[key] = value;
        ContextMenu.update(key);
    }
</script>

<Toggle value={$settings.context_steam_store}
        ontoggle={value => handleChange("context_steam_store", value)}>
    {L(__options_contextSteamStore, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_lucky}
        ontoggle={value => handleChange("context_steam_lucky", value)}>
    {L(__options_contextSteamLucky, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_market}
        ontoggle={value => handleChange("context_steam_market", value)}>
    {L(__options_contextSteamMarket, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_itad}
        ontoggle={value => handleChange("context_itad", value)}>
    {L(__options_contextItad, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_bartervg}
        ontoggle={value => handleChange("context_bartervg", value)}>
    {L(__options_contextBartervg, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb}
        ontoggle={value => handleChange("context_steamdb", value)}>
    {L(__options_contextSteamdb, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb_instant}
        ontoggle={value => handleChange("context_steamdb_instant", value)}>
    {L(__options_contextSteamdbInstant, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_keys}
        ontoggle={value => handleChange("context_steam_keys", value)}>
    {L(__options_contextSteamKeys)}
</Toggle>
