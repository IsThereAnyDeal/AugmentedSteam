<script lang="ts">
    import {SyncedStorage} from "../../../../modulesCore";
    import SteamMediumButton from "../../../SteamMediumButton.svelte";

    export let appid: number;
</script>


{#if SyncedStorage.get("showsteamdb")}
    <SteamMediumButton icon="steamdb_ico" href="https://steamdb.info/app/{appid}/">SteamDB</SteamMediumButton>
{/if}

{#if SyncedStorage.get("showitadlinks")}
    <SteamMediumButton icon="itad_ico" href="https://isthereanydeal.com/steam/app/{appid}/">ITAD</SteamMediumButton>
{/if}

{#if SyncedStorage.get("showbartervg")}
    <SteamMediumButton icon="bartervg_ico" href="https://barter.vg/steam/app/{appid}/">Barter.vg</SteamMediumButton>
{/if}
