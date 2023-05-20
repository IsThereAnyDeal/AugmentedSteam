<script lang="ts">
    import CommunityAppPageLink from "./CommunityAppPageLink.svelte";
    import {SyncedStorage} from "../../../../modulesCore";

    export let appid: number;

    const links = [
        {
            "opt": "showsteamdb",
            "cls": "steamdb_ico",
            "url": `https://steamdb.info/app/${appid}/`,
            "str": "SteamDB",
        },
        {
            "opt": "showitadlinks",
            "cls": "itad_ico",
            "url": `https://isthereanydeal.com/steam/app/${appid}/`,
            "str": "ITAD",
        },
        {
            "opt": "showbartervg",
            "cls": "bartervg_ico",
            "url": `https://barter.vg/steam/app/${appid}/`,
            "str": "Barter.vg",
        },
    ] as const;
</script>

{#each links as {opt, cls, url, str}}
    {#if SyncedStorage.get(opt)}
        <CommunityAppPageLink {cls} {url} {str} />
    {/if}
{/each}
