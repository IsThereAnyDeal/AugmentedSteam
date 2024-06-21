<script lang="ts">
    import type {Writable} from "svelte/store";
    import type {SettingsSchema} from "../../../Data/_types";
    import {
        __options_contextBartervg,
        __options_contextItad,
        __options_contextSteamdb,
        __options_contextSteamdbInstant,
        __options_contextSteamKeys,
        __options_contextSteamMarket,
        __options_contextSteamStore
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Toggle from "../Components/Toggle.svelte";
    import Permissions from "@Core/Permissions";

    export let settings: Writable<SettingsSchema>;

    async function handleChange(value: boolean): Promise<boolean> {
        if (!value) {
            return false;
        }

        const permissions = ["contextMenus"];
        const hasPermissions = await Permissions.contains(permissions);
        if (hasPermissions) {
            return true;
        }

        // @ts-ignore
        return Permissions.request(permissions);
    }
</script>

<Toggle value={$settings.context_steam_store}
        on:toggle={async (e) => $settings.context_steam_store = await handleChange(e.detail)}>
    {L(__options_contextSteamStore, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_market}
        on:toggle={async (e) => $settings.context_steam_market = await handleChange(e.detail)}>
    {L(__options_contextSteamMarket, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_itad}
        on:toggle={async (e) => $settings.context_itad = await handleChange(e.detail)}>
    {L(__options_contextItad, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_bartervg}
        on:toggle={async (e) => $settings.context_bartervg = await handleChange(e.detail)}>
    {L(__options_contextBartervg, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb}
        on:toggle={async (e) => $settings.context_steamdb = await handleChange(e.detail)}>
    {L(__options_contextSteamdb, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb_instant}
        on:toggle={async (e) => $settings.context_steamdb_instant = await handleChange(e.detail)}>
    {L(__options_contextSteamdbInstant, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_keys}
        on:toggle={async (e) => $settings.context_steam_keys = await handleChange(e.detail)}>
    {L(__options_contextSteamKeys)}
</Toggle>
