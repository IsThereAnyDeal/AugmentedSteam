<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__options_quickinv, __options_quickinvDiff, __theworddefault} from "@Strings/_strings";
    import SubOptions from "../Components/SubOptions.svelte";
    import Toggle from "../Components/Toggle.svelte";
    import type {SettingsSchema} from "../../../Data/_types";
    import type {Writable} from "svelte/store";
    import {SettingsStore} from "../../../Data/Settings";

    export let settings: Writable<SettingsSchema>;

    function handleDefault() {
        SettingsStore.remove("quickinv_diff");
        $settings = $settings;
    }
</script>


<Toggle bind:value={$settings.quickinv}>{L(__options_quickinv)}</Toggle>

{#if $settings.quickinv}
    <SubOptions>
        <div>
            <label>
                <span>{L(__options_quickinvDiff)}</span>
                <input type="number" class="inpt" step="0.01" bind:value={$settings.quickinv_diff}>
            </label>
            <button type="button" class="btn" on:click={handleDefault}>{L(__theworddefault)}</button>
        </div>
    </SubOptions>
{/if}


<style>
    div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    label > span {
        display: block;
        font-size: 0.92em;
    }
</style>
