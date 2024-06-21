<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __options_lowestprice,
        __options_lowestpriceCoupon,
        __options_lowestpriceHeader,
        __options_lowestpriceOnwishlist,
        __options_regionalPrice,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import RegionSelect from "./Settings/RegionSelect.svelte";
    import StoreList from "./Settings/StoreListSetting.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import OverridePriceSetting from "./Settings/OverridePriceSetting.svelte";
    import OptionGroup from "./Components/OptionGroup.svelte";

    let settings: Writable<SettingsSchema> = writable(Settings);
</script>


<Section title={L(__options_lowestpriceHeader)}>
    <OptionGroup>
        <Toggle bind:value={$settings.showlowestprice}>{L(__options_lowestprice)}</Toggle>
        <Toggle bind:value={$settings.showlowestprice_onwishlist}>{L(__options_lowestpriceOnwishlist)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.showlowestpricecoupon}>{L(__options_lowestpriceCoupon)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <StoreList {settings} />
    </OptionGroup>

    <OptionGroup>
        <OverridePriceSetting {settings} />
    </OptionGroup>
</Section>

<Section title={L(__options_regionalPrice)}>
    <RegionSelect {settings} />
</Section>
