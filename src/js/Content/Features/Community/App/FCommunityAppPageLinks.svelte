<script lang="ts">
    import SteamMediumButton from "../../../SteamMediumButton.svelte";
    import Settings from "@Options/Data/Settings";

    export let appid: number;
</script>


{#if Settings.showsteamdb}
    <SteamMediumButton icon="steamdb_ico" href="https://steamdb.info/app/{appid}/">SteamDB</SteamMediumButton>
{/if}

{#if Settings.showitadlinks}
    <SteamMediumButton icon="itad_ico" href="https://isthereanydeal.com/steam/app/{appid}/">ITAD</SteamMediumButton>
{/if}

{#if Settings.showbartervg}
    <SteamMediumButton icon="bartervg_ico" href="https://barter.vg/steam/app/{appid}/">Barter.vg</SteamMediumButton>
{/if}
