<svelte:options immutable={false} />

<script lang="ts">
    import { run } from 'svelte/legacy';

    import {
        __always, __never,
        __options_addAnotherRegion,
        __options_regionalHideworld, __options_regionalPriceMouse, __options_regionalPriceOn,
        __thewordclear,
        __theworddefault
    } from "@Strings/_strings";
    import Toggle from "../Components/Toggle.svelte";
    import {onMount} from "svelte";
    import {SettingsStore} from "../../../Data/Settings";
    import LocalizedCountryList from "../Components/LocalizedCountryList";
    import Select from "../Components/Select.svelte";
    import type {SettingsSchema} from "../../../Data/_types";
    import type {Writable} from "svelte/store";
    import {L} from "@Core/Localization/Localization";
    import DeleteIcon from "../../Icons/DeleteIcon.svelte";
    import {slide} from "svelte/transition";
    import OptionGroup from "../Components/OptionGroup.svelte";
    import FlagIcon from "@Icons/FlagIcon.svelte";

    interface Props {
        settings: Writable<SettingsSchema>;
    }

    let { settings }: Props = $props();

    let localizedCountries: [string, string][] = $state([]);
    let selection: string[] = $state([]);
    run(() => {
        selection = $settings.regional_countries;
    });

    function add() {
        selection.push("us");
        selection = selection;
        $settings.regional_countries = selection;
    }

    function reset() {
        SettingsStore.remove("regional_countries");
        $settings = $settings;
    }

    function clear() {
        $settings.regional_countries = [];
    }

    function handleRemove(index: number) {
        selection.splice(index, 1);
        $settings.regional_countries = selection;
    }

    function handleChange(index: number, e: Event) {
        const country = (<HTMLSelectElement>e.target!).value;

        selection.splice(index, 1, country);
        $settings.regional_countries = selection;
    }

    onMount(() => {
        localizedCountries = LocalizedCountryList()
            .sort(([, a], [, b]) => a.localeCompare(b));
    });
</script>


<OptionGroup>
    <Select bind:value={$settings.showregionalprice} label={L(__options_regionalPriceOn)} options={[
        ["mouse", L(__options_regionalPriceMouse)],
        ["always", L(__always)],
        ["off", L(__never)]
    ]} />
</OptionGroup>

{#if $settings.showregionalprice === "mouse"}
    <div class="group" transition:slide={{axis: "y", duration: 200}}>
        <OptionGroup>
            <Toggle bind:value={$settings.regional_hideworld}>{L(__options_regionalHideworld)}</Toggle>
        </OptionGroup>
    </div>
{/if}

{#if $settings.showregionalprice !== "off"}
    <div class="group" transition:slide={{axis: "y", duration: 200}}>
        <OptionGroup>
            <div>
                {#each selection as country, index}
                    <div class="option">
                        <FlagIcon {country} />
                        <Select value={country} options={localizedCountries} on:change={e => handleChange(index, e)} />
                        <button type="button" onclick={() => handleRemove(index)}>
                            <DeleteIcon />
                        </button>
                    </div>
                {/each}
            </div>

            <div class="buttons">
                <button type="button" class="btn" onclick={add}>{L(__options_addAnotherRegion)}</button>
                <button type="button" class="btn" onclick={reset}>{L(__theworddefault)}</button>
                <button type="button" class="btn" onclick={clear}>{L(__thewordclear)}</button>
            </div>
        </OptionGroup>
    </div>
{/if}


<style>
    .group {
        border-top: 1px solid #262833;
    }

    .option {
        display: flex;
        align-items: center;
    }

    .buttons {
        margin-top: 10px;
        display: flex;
        justify-content: flex-start;
        gap: 10px;
    }
</style>
