<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__options_hidespamcomments, __options_spamcommentregex, __theworddefault} from "@Strings/_strings";
    import Toggle from "../Components/Toggle.svelte";
    import type {Writable} from "svelte/store";
    import type {SettingsSchema} from "../../../Data/_types";
    import {SettingsStore} from "../../../Data/Settings";
    import SubOptions from "../Components/SubOptions.svelte";

    export let settings: Writable<SettingsSchema>

    function handleDefault() {
        SettingsStore.remove("spamcommentregex");
        $settings = $settings;
    }
</script>


<Toggle bind:value={$settings.hidespamcomments}>{L(__options_hidespamcomments)}</Toggle>

{#if $settings.hidespamcomments}
    <SubOptions>
        <div>
            <label>
                <span>{L(__options_spamcommentregex)}</span>
                <input type="text" class="inpt" bind:value={$settings.spamcommentregex}>
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
