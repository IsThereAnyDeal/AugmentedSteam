<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __all,
        __discussions,
        __guides,
        __news,
        __options_artwork,
        __options_broadcasts,
        __options_communityDefaultTab,
        __options_confirmdeletecomment,
        __options_friendActivity,
        __options_friendsAndGroups,
        __options_friendsAppendNickname,
        __options_general,
        __options_group,
        __options_groupLinks,
        __options_hideactivelistings,
        __options_hideannouncementcomments,
        __options_inventory,
        __options_inventoryNavText,
        __options_market,
        __options_marketTotal,
        __options_profile,
        __options_profileLinkImages,
        __options_profileLinkImagesColor,
        __options_profileLinkImagesGray,
        __options_profileLinkImagesNone,
        __options_profileLinks,
        __options_profilePinnedBg,
        __options_profileShowcaseOwnTwitch,
        __options_profileShowcaseTwitch,
        __options_profileShowcaseTwitchProfileonly,
        __options_profileSteamid,
        __options_removeguideslanguagefilter,
        __options_replacecommunityhublinks,
        __options_screenshots,
        __options_show1clickgoo,
        __options_showallstats,
        __options_showCustomThemes,
        __options_showlowestmarketprice,
        __options_showWishlistCount,
        __options_showWishlistLink,
        __options_steamcardexchange,
        __options_steamrepapi,
        __options_videos,
        __options_wlbuttoncommunityapp,
        __reviews,
        __workshop_workshop,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import CustomLinks from "./Settings/CustomLinks.svelte";
    import Select from "./Components/Select.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import HideSpamCommentsSettings from "./Settings/HideSpamCommentsSettings.svelte";
    import SubOptions from "./Components/SubOptions.svelte";
    import QuickSellSettings from "./Settings/QuickSellSettings.svelte";
    import ProfileLink from "@Options/Modules/Options/Components/ProfileLink.svelte";

    let settings: Writable<SettingsSchema> = writable(Settings);
</script>


<Section title={L(__options_general)}>
    <OptionGroup>
        <Select bind:value={$settings.community_default_tab} label={L(__options_communityDefaultTab)} options={[
            ["", L(__all)],
            ["discussions", L(__discussions)],
            ["screenshots", L(__options_screenshots)],
            ["images", L(__options_artwork)],
            ["broadcasts", L(__options_broadcasts)],
            ["videos", L(__options_videos)],
            ["workshop", L(__workshop_workshop)],
            ["allnews", L(__news)],
            ["guides", L(__guides)],
            ["reviews", L(__reviews)],
        ]} />
    </OptionGroup>

    <OptionGroup>
        <Select bind:value={$settings.show_profile_link_images} label={L(__options_profileLinkImages)} options={[
            ["gray", L(__options_profileLinkImagesGray)],
            ["color", L(__options_profileLinkImagesColor)],
            ["none", L(__options_profileLinkImagesNone)]
        ]} />
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.showallstats}>{L(__options_showallstats)}</Toggle>
        <Toggle bind:value={$settings.steamcardexchange}>{L(__options_steamcardexchange)}</Toggle>
        <Toggle bind:value={$settings.wlbuttoncommunityapp}>{L(__options_wlbuttoncommunityapp)}</Toggle>
        <Toggle bind:value={$settings.confirmdeletecomment}>{L(__options_confirmdeletecomment)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.removeguideslanguagefilter}>{L(__options_removeguideslanguagefilter)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <HideSpamCommentsSettings {settings} />
    </OptionGroup>
</Section>

<Section title={L(__options_market)}>
    <Toggle bind:value={$settings.showmarkettotal}>{L(__options_marketTotal)}</Toggle>
    <Toggle bind:value={$settings.showlowestmarketprice}>{L(__options_showlowestmarketprice)}</Toggle>
    <Toggle bind:value={$settings.hideactivelistings}>{L(__options_hideactivelistings)}</Toggle>
</Section>

<Section title={L(__options_inventory)}>
    <OptionGroup>
        <Toggle bind:value={$settings.showinvnav}>{L(__options_inventoryNavText)}</Toggle>
        <QuickSellSettings {settings} />
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.show1clickgoo}>{L(__options_show1clickgoo)}</Toggle>
    </OptionGroup>
</Section>

<Section title={L(__options_profile)}>
    <OptionGroup>
        <Toggle bind:value={$settings.show_custom_themes}>{L(__options_showCustomThemes)}</Toggle>
        <Toggle bind:value={$settings.show_wishlist_link}>{L(__options_showWishlistLink)}</Toggle>
        {#if $settings.show_wishlist_link}
            <SubOptions>
                <Toggle bind:value={$settings.show_wishlist_count}>{L(__options_showWishlistCount)}</Toggle>
            </SubOptions>
        {/if}
        <Toggle bind:value={$settings.showsteamrepapi}>{L(__options_steamrepapi)}</Toggle>
        <Toggle bind:value={$settings.profile_steamid}>{L(__options_profileSteamid)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.profile_pinned_bg}>{L(__options_profilePinnedBg)}</Toggle>
    </OptionGroup>

    <OptionGroup>
        <Toggle bind:value={$settings.profile_showcase_twitch}>{L(__options_profileShowcaseTwitch)}</Toggle>
        {#if $settings.profile_showcase_twitch}
            <SubOptions>
                <Toggle bind:value={$settings.profile_showcase_own_twitch}>{L(__options_profileShowcaseOwnTwitch)}</Toggle>
                <Toggle bind:value={$settings.profile_showcase_twitch_profileonly}>{L(__options_profileShowcaseTwitchProfileonly)}</Toggle>
            </SubOptions>
        {/if}
    </OptionGroup>

    <OptionGroup>
        <h3>{L(__options_profileLinks)}</h3>
        {#if $settings.language === "schinese" || $settings.language === "tchinese"}
            <Toggle bind:value={$settings.profile_steamrepcn}>
                <ProfileLink id="steamrepcn" type={$settings.show_profile_link_images}>SteamrepCN</ProfileLink>
            </Toggle>
        {/if}
        <Toggle bind:value={$settings.profile_steamrep}>
            <ProfileLink id="steamrep" type={$settings.show_profile_link_images}>SteamRep</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_steamdbcalc}>
            <ProfileLink id="steamdbcalc" type={$settings.show_profile_link_images}>SteamDB</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_steamgifts}>
            <ProfileLink id="steamgifts" type={$settings.show_profile_link_images}>SteamGifts</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_steamtrades}>
            <ProfileLink id="steamtrades" type={$settings.show_profile_link_images}>SteamTrades</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_bartervg}>
            <ProfileLink id="bartervg" type={$settings.show_profile_link_images}>Barter.vg</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_astats}>
            <ProfileLink id="astats" type={$settings.show_profile_link_images}>Achievement Stats</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_backpacktf}>
            <ProfileLink id="backpacktf" type={$settings.show_profile_link_images}>Backpack.tf</ProfileLink>
        </Toggle>
        <Toggle bind:value={$settings.profile_astatsnl}>
            <ProfileLink id="astatsnl" type={$settings.show_profile_link_images}>Astats.nl</ProfileLink>
        </Toggle>
    </OptionGroup>

    <OptionGroup>
        <CustomLinks type="profile" />
    </OptionGroup>
</Section>

<Section title={L(__options_group)}>
    <h3>{L(__options_groupLinks)}</h3>
    <Toggle bind:value={$settings.group_steamgifts}>
        <ProfileLink id="steamgifts" type={$settings.show_profile_link_images}>SteamGifts</ProfileLink>
    </Toggle>
</Section>

<Section title={L(__options_friendsAndGroups)}>
    <Toggle bind:value={$settings.friends_append_nickname}>{L(__options_friendsAppendNickname)}</Toggle>
</Section>

<Section title={L(__options_friendActivity)}>
    <Toggle bind:value={$settings.replacecommunityhublinks}>{L(__options_replacecommunityhublinks)}</Toggle>
    <Toggle bind:value={$settings.hideannouncementcomments}>{L(__options_hideannouncementcomments)}</Toggle>
</Section>
