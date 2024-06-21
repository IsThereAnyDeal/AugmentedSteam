<svelte:options immutable={false} />

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
    import ContextMenu from "@Background/Modules/ContextMenu/ContextMenu";

    type ContextMenuKeys = keyof SettingsSchema & (
         "context_steam_store"
       | "context_steam_market"
       | "context_itad"
       | "context_bartervg"
       | "context_steamdb"
       | "context_steamdb_instant"
       | "context_steam_keys"
    );

    export let settings: Writable<SettingsSchema>;

    async function handleChange(key: ContextMenuKeys, value: boolean): Promise<void> {
        if (value) {
            const permissions = ["contextMenus"];
            const hasPermissions = await Permissions.contains(permissions);
            if (!hasPermissions) {
                // @ts-expect-error
                value = await Permissions.request(permissions);
            }
        }

        $settings[key] = value;
        ContextMenu.update();
    }
</script>

<Toggle value={$settings.context_steam_store}
        on:toggle={async (e) => handleChange("context_steam_store", e.detail)}>
    {L(__options_contextSteamStore, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_market}
        on:toggle={async (e) => handleChange("context_steam_market", e.detail)}>
    {L(__options_contextSteamMarket, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_itad}
        on:toggle={async (e) => handleChange("context_itad", e.detail)}>
    {L(__options_contextItad, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_bartervg}
        on:toggle={async (e) => handleChange("context_bartervg", e.detail)}>
    {L(__options_contextBartervg, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb}
        on:toggle={async (e) => handleChange("context_steamdb", e.detail)}>
    {L(__options_contextSteamdb, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steamdb_instant}
        on:toggle={async (e) => handleChange("context_steamdb_instant", e.detail)}>
    {L(__options_contextSteamdbInstant, {query: "..."})}
</Toggle>

<Toggle value={$settings.context_steam_keys}
        on:toggle={async (e) => handleChange("context_steam_keys", e.detail)}>
    {L(__options_contextSteamKeys)}
</Toggle>
