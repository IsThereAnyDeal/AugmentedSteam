<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __highlight,
        __ignoredOwned,
        __notinterested,
        __options_collection,
        __options_coupon,
        __options_excludef2p,
        __options_general,
        __options_gift,
        __options_guest,
        __options_homepageDefaultTab,
        __options_homepageDefaultTabFree,
        __options_homepageDefaultTabNewreleases,
        __options_homepageDefaultTabRemember,
        __options_homepageDefaultTabSpecials,
        __options_homepageDefaultTabTopsellers,
        __options_homepageDefaultTabUpcoming,
        __options_horizontalscrolling,
        __options_oneclickremovewl,
        __options_owned,
        __options_showAlternativeLinuxIcon,
        __options_showEarlyAccess,
        __options_showEmptyWishlist,
        __options_showWishlistStats,
        __options_skipGotSteam,
        __options_tag,
        __options_userNotes_app,
        __options_userNotes_loc,
        __options_userNotes_local,
        __options_userNotes_syncedStorage,
        __options_userNotes_userNotes,
        __options_userNotes_wishlist,
        __options_waitlist,
        __options_wishlist,
        __tagShort,
        __wishlist,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings, {SettingsStore} from "../../Data/Settings";
    import ColorToggle from "./Components/ColorToggle.svelte";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import Select from "./Components/Select.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import UserNotesAdapter from "@Content/Modules/UserNotes/UserNotesAdapter";

    let settings: Writable<SettingsSchema> = writable(Settings);

    function handleUserNotesAdapterChange(e_: Event) {
        const e = e_ as (InputEvent & {target: HTMLSelectElement});
        const newType = e.target.value;
        // @ts-expect-error
        UserNotesAdapter.changeAdapter(newType);
    }
</script>


<div>
    <Section title={L(__highlight)}>
        <OptionGroup>
            <ColorToggle bind:enabled={$settings.highlight_owned}
                         bind:color={$settings.highlight_owned_color}
                         defaultColor={SettingsStore.getDefault("highlight_owned_color")}>
                {L(__options_owned)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_wishlist}
                         bind:color={$settings.highlight_wishlist_color}
                         defaultColor={SettingsStore.getDefault("highlight_wishlist_color")}>
                {L(__options_wishlist)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_coupon}
                         bind:color={$settings.highlight_coupon_color}
                         defaultColor={SettingsStore.getDefault("highlight_coupon_color")}>
                {L(__options_coupon)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_inv_gift}
                         bind:color={$settings.highlight_inv_gift_color}
                         defaultColor={SettingsStore.getDefault("highlight_inv_gift_color")}>
                {L(__options_gift)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_inv_guestpass}
                         bind:color={$settings.highlight_inv_guestpass_color}
                         defaultColor={SettingsStore.getDefault("highlight_inv_guestpass_color")}>
                {L(__options_guest)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_notinterested}
                         bind:color={$settings.highlight_notinterested_color}
                         defaultColor={SettingsStore.getDefault("highlight_notinterested_color")}>
                {L(__notinterested)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_ignored_owned}
                         bind:color={$settings.highlight_ignored_owned_color}
                         defaultColor={SettingsStore.getDefault("highlight_ignored_owned_color")}>
                {L(__ignoredOwned)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_collection}
                         bind:color={$settings.highlight_collection_color}
                         defaultColor={SettingsStore.getDefault("highlight_collection_color")}>
                {L(__options_collection)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.highlight_waitlist}
                         bind:color={$settings.highlight_waitlist_color}
                         defaultColor={SettingsStore.getDefault("highlight_waitlist_color")}>
                {L(__options_waitlist)}
            </ColorToggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.highlight_excludef2p}>{L(__options_excludef2p)}</Toggle>
        </OptionGroup>
    </Section>

    <Section title={L(__options_tag)}>
        <OptionGroup>
            <ColorToggle bind:enabled={$settings.tag_owned}
                         bind:color={$settings.tag_owned_color}
                         defaultColor={SettingsStore.getDefault("tag_owned_color")}>
                {L(__options_owned)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_wishlist}
                         bind:color={$settings.tag_wishlist_color}
                         defaultColor={SettingsStore.getDefault("tag_wishlist_color")}>
                {L(__options_wishlist)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_coupon}
                         bind:color={$settings.tag_coupon_color}
                         defaultColor={SettingsStore.getDefault("tag_coupon_color")}>
                {L(__options_coupon)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_inv_gift}
                         bind:color={$settings.tag_inv_gift_color}
                         defaultColor={SettingsStore.getDefault("tag_inv_gift_color")}>
                {L(__options_gift)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_inv_guestpass}
                         bind:color={$settings.tag_inv_guestpass_color}
                         defaultColor={SettingsStore.getDefault("tag_inv_guestpass_color")}>
                {L(__options_guest)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_notinterested}
                         bind:color={$settings.tag_notinterested_color}
                         defaultColor={SettingsStore.getDefault("tag_notinterested_color")}>
                {L(__notinterested)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_ignored_owned}
                         bind:color={$settings.tag_ignored_owned_color}
                         defaultColor={SettingsStore.getDefault("tag_ignored_owned_color")}>
                {L(__ignoredOwned)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_collection}
                         bind:color={$settings.tag_collection_color}
                         defaultColor={SettingsStore.getDefault("tag_collection_color")}>
                {L(__options_collection)}
            </ColorToggle>

            <ColorToggle bind:enabled={$settings.tag_waitlist}
                         bind:color={$settings.tag_waitlist_color}
                         defaultColor={SettingsStore.getDefault("tag_waitlist_color")}>
                {L(__options_waitlist)}
            </ColorToggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.tag_short}>{L(__tagShort)}</Toggle>
        </OptionGroup>
    </Section>

    <Section title={L(__options_userNotes_userNotes)}>
        <OptionGroup>
            <Toggle bind:value={$settings.user_notes_app}>{L(__options_userNotes_app)}</Toggle>
            <Toggle bind:value={$settings.user_notes_wishlist}>{L(__options_userNotes_wishlist)}</Toggle>
        </OptionGroup>
        <OptionGroup>
            <Select value={$settings.user_notes_adapter} label={L(__options_userNotes_loc)} options={[
                ["idb", L(__options_userNotes_local)],
                ["synced_storage", L(__options_userNotes_syncedStorage)]
            ]} on:change={handleUserNotesAdapterChange} />
        </OptionGroup>
    </Section>

    <Section title={L(__wishlist)}>
        <OptionGroup>
            <Toggle bind:value={$settings.showemptywishlist}>{L(__options_showEmptyWishlist)}</Toggle>
            <Toggle bind:value={$settings.showwishliststats}>{L(__options_showWishlistStats)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.oneclickremovewl}>{L(__options_oneclickremovewl)}</Toggle>
        </OptionGroup>
    </Section>

    <Section title={L(__options_general)}>
        <OptionGroup>
            <Toggle bind:value={$settings.show_early_access}>{L(__options_showEarlyAccess)}</Toggle>
            <Toggle bind:value={$settings.show_alternative_linux_icon}>{L(__options_showAlternativeLinuxIcon)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.horizontalscrolling}>{L(__options_horizontalscrolling)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Toggle bind:value={$settings.skip_got_steam}>{L(__options_skipGotSteam)}</Toggle>
        </OptionGroup>

        <OptionGroup>
            <Select bind:value={$settings.homepage_tab_selection} label={L(__options_homepageDefaultTab)} options={[
                ["remember", L(__options_homepageDefaultTabRemember)],
                ["tab_newreleases_content_trigger", L(__options_homepageDefaultTabNewreleases)],
                ["tab_topsellers_content_trigger", L(__options_homepageDefaultTabTopsellers)],
                ["tab_upcoming_content_trigger", L(__options_homepageDefaultTabUpcoming)],
                ["tab_specials_content_trigger", L(__options_homepageDefaultTabSpecials)],
                ["tab_trendingfree_content_trigger", L(__options_homepageDefaultTabFree)]
            ]} />
        </OptionGroup>
    </Section>
</div>
