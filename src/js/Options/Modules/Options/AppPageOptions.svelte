<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __achievements_option,
        __options_apppage,
        __options_completionistme,
        __options_drm,
        __options_exfgls,
        __options_hltb,
        __options_itadlinks,
        __options_metacritic,
        __options_mp4video,
        __options_opencritic,
        __options_pcgw,
        __options_protondb,
        __options_purchaseDates,
        __options_removebroadcasts,
        __options_showAstatslink,
        __options_showBadgeProgress,
        __options_showbartervg,
        __options_showCoupon,
        __options_showPackageInfo,
        __options_showPlayersInfo,
        __options_showViewInLibrary,
        __options_showYoutubegameplay,
        __options_showYoutubereviews,
        __options_steamdb,
        __options_storeGeneralThirdparty,
        __options_storeSteamcards,
        __options_supportinfo,
        __options_twitch,
        __options_wsgf,
        __options_youtube,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import CustomLinks from "./Settings/CustomLinks.svelte";
    import type {SettingsSchema} from "../../Data/_types";

    let settings: Writable<SettingsSchema> = writable(Settings);
</script>


<Section title={L(__options_apppage)}>
    <OptionGroup>
        <Toggle bind:value={$settings.mp4video}>{L(__options_mp4video)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.showsupportinfo}>{L(__options_supportinfo)}</Toggle>
        <Toggle bind:value={$settings.showdrm}>{L(__options_drm)}</Toggle>
        <Toggle bind:value={$settings.showviewinlibrary}>{L(__options_showViewInLibrary)}</Toggle>
        <Toggle bind:value={$settings.show_package_info}>{L(__options_showPackageInfo)}</Toggle>
        <Toggle bind:value={$settings.showachinstore}>{L(__achievements_option)}</Toggle>
        <Toggle bind:value={$settings.purchase_dates}>{L(__options_purchaseDates)}</Toggle>
        <Toggle bind:value={$settings.show_badge_progress}>{L(__options_showBadgeProgress)}</Toggle>
        <Toggle bind:value={$settings.show_coupon}>{L(__options_showCoupon)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.removebroadcasts}>{L(__options_removebroadcasts)}</Toggle>
    </OptionGroup>
</Section>

<Section title={L(__options_storeGeneralThirdparty)}>
    <Toggle bind:value={$settings.exfgls}>{L(__options_exfgls)}</Toggle>
    <Toggle bind:value={$settings.showmcus}>{L(__options_metacritic)}</Toggle>
    <Toggle bind:value={$settings.showoc}>{L(__options_opencritic)}</Toggle>
    <Toggle bind:value={$settings.showhltb}>{L(__options_hltb)}</Toggle>
    <Toggle bind:value={$settings.showwsgf}>{L(__options_wsgf)}</Toggle>
    <Toggle bind:value={$settings.show_players_info}>{L(__options_showPlayersInfo)}</Toggle>
    <Toggle bind:value={$settings.showastatslink}>{L(__options_showAstatslink)}</Toggle>
    <Toggle bind:value={$settings.showitadlinks}>{L(__options_itadlinks)}</Toggle>
    <Toggle bind:value={$settings.showsteamdb}>{L(__options_steamdb)}</Toggle>
    <Toggle bind:value={$settings.showbartervg}>{L(__options_showbartervg)}</Toggle>
    <Toggle bind:value={$settings.showsteamcardexchange}>{L(__options_storeSteamcards)}</Toggle>
    <Toggle bind:value={$settings.showprotondb}>{L(__options_protondb)}</Toggle>
    <Toggle bind:value={$settings.showcompletionistme}>{L(__options_completionistme)}</Toggle>
    <Toggle bind:value={$settings.showpcgw}>{L(__options_pcgw)}</Toggle>
    <Toggle bind:value={$settings.showtwitch}>{L(__options_twitch)}</Toggle>
    <Toggle bind:value={$settings.showyoutube}>{L(__options_youtube)}</Toggle>
    <Toggle bind:value={$settings.showyoutubegameplay}>{L(__options_showYoutubegameplay)}</Toggle>
    <Toggle bind:value={$settings.showyoutubereviews}>{L(__options_showYoutubereviews)}</Toggle>
</Section>

<Section>
    <OptionGroup>
        <CustomLinks type="app" />
    </OptionGroup>
</Section>
