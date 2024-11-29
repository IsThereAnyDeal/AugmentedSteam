<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import type {Options} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
    import {L} from "@Core/Localization/Localization";
    import {
        __tag_collection,
        __tag_coupon,
        __tag_ignoredOwned,
        __tag_invGift,
        __tag_invGuestpass,
        __tag_notinterested,
        __tag_owned,
        __tag_waitlist,
        __tag_wishlist
    } from "@Strings/_strings";

    const short = Settings.tag_short;
    const setup: Record<keyof Options, [string, string]> = {
        owned:        [__tag_owned,         Settings.tag_owned_color],
        wishlisted:   [__tag_wishlist,      Settings.tag_wishlist_color],
        coupon:       [__tag_coupon,        Settings.tag_coupon_color],
        gift:         [__tag_invGift,       Settings.tag_inv_gift_color],
        guestPass:    [__tag_invGuestpass,  Settings.tag_inv_guestpass_color],
        ignored:      [__tag_notinterested, Settings.tag_notinterested_color],
        ignoredOwned: [__tag_ignoredOwned,  Settings.tag_ignored_owned_color],
        waitlisted:   [__tag_waitlist,      Settings.tag_waitlist_color],
        collected:    [__tag_collection,    Settings.tag_collection_color],
    };

    export let options: Array<keyof Options>;

    let node: HTMLElement;

    export function isConnected(): boolean {
        return node.isConnected;
    }
</script>


<div class="as-tags" class:is-short={short} bind:this={node}>
    {#each options as option}
        {@const [locale, color] = setup[option]}
        <span style:background-color={color}>{L(locale)}</span>
    {/each}
</div>


<style>
    div {
        position: relative;
        z-index: 6;
        display: inline-block;
        margin: 0 2px;
    }
    div span {
        padding: 3px 5px;
        margin: 0 3px 0 0;
        font-size: 10px;
        font-family: Arial, sans-serif;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.75);
        max-height: 11px;
        line-height: 12px;
        display: inline-block;
        box-shadow: rgba(0, 0, 0, 0.7) 0 0 0 1px inset, rgba(255, 255, 255, 0.12) 0 0 0 2px inset;
    }
    div.is-short:not(:hover) span {
        font-size: 0;
    }
    div.is-short span::first-letter {
        font-size: 10px;
    }
</style>
