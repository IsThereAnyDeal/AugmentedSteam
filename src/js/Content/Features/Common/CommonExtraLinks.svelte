<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__viewOnWebsite} from "@Strings/_strings";
    import Settings from "@Options/Data/Settings";
    import ExtraLink from "@Content/Features/Store/Common/ExtraLinks/ExtraLink.svelte";

    interface Props {
        type: "app"|"sub"|"bundle";
        gameid: number;
        isCommunity?: boolean;
    }

    let { type, gameid, isCommunity = false }: Props = $props();
</script>


{#if Settings.showitadlinks}
    <ExtraLink href="https://isthereanydeal.com/steam/{type}/{gameid}/" icon="itad_ico" {isCommunity}>
        {isCommunity ? "ITAD" : L(__viewOnWebsite, {"website": "IsThereAnyDeal"})}
    </ExtraLink>
{/if}

{#if Settings.showsteamdb}
    <ExtraLink href="https://steamdb.info/{type}/{gameid}/" icon="steamdb_ico" {isCommunity}>
        {isCommunity ? "SteamDB" : L(__viewOnWebsite, {"website": "SteamDB"})}
    </ExtraLink>
{/if}

{#if Settings.showbartervg}
    <ExtraLink href="https://barter.vg/steam/{type}/{gameid}/" icon="bartervg_ico" {isCommunity}>
        {isCommunity ? "Barter.vg" : L(__viewOnWebsite, {"website": "Barter.vg"})}
    </ExtraLink>
{/if}
