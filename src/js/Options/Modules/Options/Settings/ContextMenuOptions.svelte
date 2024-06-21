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

    export let settings: Writable<SettingsSchema>;

    async function onToggle(option: string, value: boolean): Promise<void> {
        const permissions = ["contextMenus"];

        // TODO remove permission when no longer needed
        if (value) {
            // Attempt to request permission when toggled on
            if (!await Permissions.contains(permissions)) {
                $settings[option] = await Permissions.request(permissions);
            }
        }

        await ContextMenu.update();
    }
</script>

{#each Object.entries(ContextMenu.queryLinks) as [option, [locale]]}
    <Toggle bind:value={$settings[option]} on:toggle={(e) => onToggle(option, e.detail)}>
        {option === "context_steam_keys" ? L(locale) : L(locale, {query: "..."})}
    </Toggle>
{/each}
