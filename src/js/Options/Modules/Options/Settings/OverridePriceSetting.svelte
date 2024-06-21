<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__options_autoDetect, __options_viewInCurrency} from "@Strings/_strings";
    import type {Writable} from "svelte/store";
    import type {SettingsSchema} from "../../../Data/_types";
    import Select from "../Components/Select.svelte";
    import {onMount} from "svelte";
    import Currencies from "@Core/Currencies";

    export let settings: Writable<SettingsSchema>

    let options: Array<[string, string]> = [];

    onMount(() => {
        options = [
            ["auto", L(__options_autoDetect)],
            ...Currencies.map(c => <[string, string]>[c.abbr, c.abbr])
        ]
    });
</script>


<Select label={L(__options_viewInCurrency)} bind:value={$settings.override_price} {options} />
